import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../api/catalog.js';
import Modal from '../components/Modal.jsx';
import { imageUrl } from '../lib/format.js';

function toForm(category, categories) {
  return {
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    image: category?.image || '',
    parent: category?.parent || '',
    isActive: category?.isActive ?? true,
    excludedId: category?._id || '',
    options: categories,
  };
}

function CategoryForm({ category, categories, onCancel, onSaved }) {
  const [form, setForm] = useState(() => toForm(category, categories));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      name: form.name,
      description: form.description,
      image: form.image,
      parent: form.parent || null,
      isActive: form.isActive,
    };
    if (form.slug) payload.slug = form.slug;
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
          <label className="admin-field">
            <span>Name *</span>
            <input value={form.name} onChange={(e) => setField('name', e.target.value)} required />
          </label>
          <label className="admin-field">
            <span>Slug (optional)</span>
            <input value={form.slug} onChange={(e) => setField('slug', e.target.value)} placeholder="auto-generated" />
          </label>
          <label className="admin-field admin-field--wide">
            <span>Image URL</span>
            <input value={form.image} onChange={(e) => setField('image', e.target.value)} placeholder="https://…" />
          </label>
          <label className="admin-field admin-field--wide">
            <span>Parent category</span>
            <select value={form.parent} onChange={(e) => setField('parent', e.target.value)}>
              <option value="">None (top level)</option>
              {categories
                .filter((item) => item._id !== form.excludedId)
                .map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="admin-field admin-field--wide">
            <span>Description</span>
            <textarea rows="3" value={form.description} onChange={(e) => setField('description', e.target.value)} />
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
          {saving ? 'Saving…' : category ? 'Save changes' : 'Create category'}
        </button>
      </div>
    </form>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const loading = loadedKey !== refreshKey;

  useEffect(() => {
    let alive = true;
    getCategories()
      .then((result) => {
        if (!alive) return;
        setCategories(result.data);
        setLoadedKey(refreshKey);
      })
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const saveCategory = async (payload) => {
    if (editing === 'new') await createCategory(payload);
    else await updateCategory(editing._id, payload);
    setEditing(null);
    setRefreshKey((key) => key + 1);
  };

  const removeCategory = async (category) => {
    if (!window.confirm(`Delete "${category.name}"?`)) return;
    try {
      await deleteCategory(category._id);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h2>Categories</h2>
          <p>Organise products into the groups shown in the shop filters.</p>
        </div>
        <button className="admin-button" onClick={() => setEditing('new')}>
          <Plus size={15} /> Add category
        </button>
      </div>

      {error && <div className="admin-form-error">{error}</div>}

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <div className="admin-loading">Loading categories…</div>
        ) : categories.length ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Slug</th>
                <th>Products</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id}>
                  <td>
                    <div className="admin-product-cell">
                      <img src={imageUrl(category.image)} alt="" />
                      <div>
                        <strong>{category.name}</strong>
                        <span>{category.description || 'No description'}</span>
                      </div>
                    </div>
                  </td>
                  <td><code>{category.slug}</code></td>
                  <td><span className="admin-badge badge-indigo">{category.productCount}</span></td>
                  <td>
                    <span className={`admin-badge ${category.isActive ? 'badge-green' : 'badge-muted'}`}>
                      {category.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="admin-icon-button" onClick={() => setEditing(category)} aria-label="Edit">
                        <Pencil size={15} />
                      </button>
                      <button className="admin-icon-button danger" onClick={() => removeCategory(category)} aria-label="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="admin-loading">No categories yet. Add your first one.</div>
        )}
      </div>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add category' : `Edit ${editing.name}`}
          onClose={() => setEditing(null)}
        >
          <CategoryForm
            category={editing === 'new' ? null : editing}
            categories={categories}
            onCancel={() => setEditing(null)}
            onSaved={saveCategory}
          />
        </Modal>
      )}
    </>
  );
}
