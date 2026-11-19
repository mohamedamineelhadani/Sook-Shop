import { useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';

import {
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  updateProduct,
} from '../api/catalog.js';
import Modal from '../components/Modal.jsx';
import { formatPrice, imageUrl } from '../lib/format.js';

function splitList(value, separator = ',') {
  return String(value || '')
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toForm(product, categories) {
  return {
    name: product?.name || '',
    slug: product?.slug || '',
    category: product?.category?._id || product?.category || categories[0]?._id || '',
    brand: product?.brand || '',
    sku: product?.sku || '',
    price: product?.price ?? '',
    compareAtPrice: product?.compareAtPrice ?? '',
    stock: product?.stock ?? 0,
    images: (product?.images || []).join('\n'),
    colors: (product?.colors || []).join(', '),
    sizes: (product?.sizes || []).join(', '),
    description: product?.description || '',
    isFeatured: product?.isFeatured || false,
    isActive: product?.isActive ?? true,
  };
}

function ProductForm({ product, categories, onCancel, onSaved }) {
  const [form, setForm] = useState(() => toForm(product, categories));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      price: Number(form.price),
      compareAtPrice: Number(form.compareAtPrice || 0),
      stock: Number(form.stock || 0),
      images: splitList(form.images, '\n'),
      colors: splitList(form.colors),
      sizes: splitList(form.sizes),
    };
    if (!payload.slug) delete payload.slug;
    try {
      await onSaved(payload);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="admin-modal-body">
        {error && <div className="admin-form-error">{error}</div>}
        <div className="admin-form-grid">
          <label className="admin-field admin-field--wide">
            <span>Product name *</span>
            <input value={form.name} onChange={(e) => setField('name', e.target.value)} required />
          </label>
          <label className="admin-field">
            <span>Slug (optional)</span>
            <input value={form.slug} onChange={(e) => setField('slug', e.target.value)} placeholder="auto-generated" />
          </label>
          <label className="admin-field">
            <span>Category *</span>
            <select value={form.category} onChange={(e) => setField('category', e.target.value)} required>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span>Brand</span>
            <input value={form.brand} onChange={(e) => setField('brand', e.target.value)} />
          </label>
          <label className="admin-field">
            <span>SKU</span>
            <input value={form.sku} onChange={(e) => setField('sku', e.target.value)} placeholder="auto-generated" />
          </label>
          <label className="admin-field">
            <span>Price *</span>
            <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setField('price', e.target.value)} required />
          </label>
          <label className="admin-field">
            <span>Compare-at price</span>
            <input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={(e) => setField('compareAtPrice', e.target.value)} />
          </label>
          <label className="admin-field">
            <span>Stock</span>
            <input type="number" min="0" value={form.stock} onChange={(e) => setField('stock', e.target.value)} />
          </label>
          <label className="admin-field">
            <span>Colors (comma separated)</span>
            <input value={form.colors} onChange={(e) => setField('colors', e.target.value)} placeholder="Black, White" />
          </label>
          <label className="admin-field admin-field--wide">
            <span>Sizes / configurations (comma separated)</span>
            <input value={form.sizes} onChange={(e) => setField('sizes', e.target.value)} placeholder="128GB, 256GB" />
          </label>
          <label className="admin-field admin-field--wide">
            <span>Image URLs (one per line)</span>
            <textarea rows="3" value={form.images} onChange={(e) => setField('images', e.target.value)} />
          </label>
          <label className="admin-field admin-field--wide">
            <span>Description</span>
            <textarea rows="3" value={form.description} onChange={(e) => setField('description', e.target.value)} />
          </label>
          <label className="admin-check">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setField('isFeatured', e.target.checked)} />
            Featured on homepage
          </label>
          <label className="admin-check">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} />
            Active / visible in shop
          </label>
        </div>
      </div>
      <div className="admin-modal-foot">
        <button type="button" className="admin-button admin-button--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="admin-button" disabled={saving}>
          {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
        </button>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const [result, setResult] = useState({ data: [] });
  const [categories, setCategories] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editing, setEditing] = useState(null);

  const loading = loadedKey !== refreshKey;

  useEffect(() => {
    let alive = true;
    Promise.all([
      getProducts({ includeInactive: 'true', limit: 100, sort: 'newest' }),
      getCategories(),
    ])
      .then(([productResult, categoryResult]) => {
        if (!alive) return;
        setResult(productResult);
        setCategories(categoryResult.data);
        setLoadedKey(refreshKey);
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const products = result.data.filter((product) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      product.name.toLowerCase().includes(term) ||
      (product.brand || '').toLowerCase().includes(term) ||
      (product.sku || '').toLowerCase().includes(term);
    const matchesCategory =
      !categoryFilter ||
      (product.category?._id || product.category) === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const saveProduct = async (payload) => {
    if (editing === 'new') await createProduct(payload);
    else await updateProduct(editing._id, payload);
    setEditing(null);
    setRefreshKey((key) => key + 1);
  };

  const removeProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(product._id);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h2>Products</h2>
          <p>Manage the catalog, prices, images and stock levels.</p>
        </div>
        <button className="admin-button" onClick={() => setEditing('new')}>
          <Plus size={15} /> Add product
        </button>
      </div>

      <div className="admin-toolbar">
        <label className="admin-search" style={{ flex: 1, maxWidth: 360 }}>
          <Search size={16} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, brand or SKU"
            aria-label="Search products"
          />
        </label>
        <select
          className="admin-select"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
        <span className="admin-result-count">{products.length} products</span>
      </div>

      {error && <div className="admin-form-error">{error}</div>}

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <div className="admin-loading">Loading products…</div>
        ) : products.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="admin-product-cell">
                      <img src={imageUrl(product.images?.[0])} alt="" />
                      <div>
                        <strong>{product.name}</strong>
                        <span>{product.brand || '—'} · {product.sku || 'no SKU'}</span>
                      </div>
                    </div>
                  </td>
                  <td>{product.category?.name || '—'}</td>
                  <td>
                    <strong>{formatPrice(product.price)}</strong>
                    {product.compareAtPrice > 0 && (
                      <span className="admin-strike">{formatPrice(product.compareAtPrice)}</span>
                    )}
                  </td>
                  <td>
                    <span className={`admin-badge ${product.stock > 0 ? 'badge-green' : 'badge-rose'}`}>
                      {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${product.isActive ? 'badge-indigo' : 'badge-muted'}`}>
                      {product.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="admin-icon-button" onClick={() => setEditing(product)} aria-label="Edit">
                        <Pencil size={15} />
                      </button>
                      <button className="admin-icon-button danger" onClick={() => removeProduct(product)} aria-label="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="admin-loading">No products match your filters.</div>
        )}
      </div>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add product' : `Edit ${editing.name}`}
          onClose={() => setEditing(null)}
        >
          <ProductForm
            product={editing === 'new' ? null : editing}
            categories={categories}
            onCancel={() => setEditing(null)}
            onSaved={saveProduct}
          />
        </Modal>
      )}
    </>
  );
}
