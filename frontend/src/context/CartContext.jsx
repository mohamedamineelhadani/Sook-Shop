import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  addCartItem,
  clearCart as clearCartRequest,
  getCart,
  removeCartItem,
  setCartQuantity,
  syncCart,
} from '../api/cart.js';
import { useAuth } from '../hooks/useAuth.js';
import { CartContext } from './cart-context.js';

const STORAGE_KEY = 'sookshop.cart.v1';

function itemKey(id, color = '', size = '') {
  return `${id}::${color || ''}::${size || ''}`;
}

function normalizeLocal(item) {
  const id = item.id || item.productId;
  return {
    id,
    key: item.key || itemKey(id, item.color, item.size),
    slug: item.slug || '',
    name: item.name || '',
    image: item.image || '',
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 1,
    maxStock: Number(item.maxStock) || 99,
    color: item.color || '',
    size: item.size || '',
  };
}

function normalizeServer(entry) {
  const product = entry.product || {};
  const id = entry.productId || product._id;
  return {
    id,
    key: entry.key || itemKey(id, entry.color, entry.size),
    slug: product.slug || '',
    name: product.name || '',
    image: product.images?.[0] || '',
    price: Number(product.price) || 0,
    quantity: entry.quantity,
    maxStock: Number(product.stock) || 99,
    color: entry.color || '',
    size: entry.size || '',
  };
}

function makeLocalItem(product, quantity, options) {
  const color = options.color || '';
  const size = options.size || '';
  return {
    id: product._id,
    key: itemKey(product._id, color, size),
    slug: product.slug || '',
    name: product.name || '',
    image: product.images?.[0] || '',
    price: Number(product.price) || 0,
    quantity: Math.max(1, Math.min(product.stock || 99, Number(quantity) || 1)),
    maxStock: Number(product.stock) || 99,
    color,
    size,
  };
}

function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeLocal) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?._id;

  const [localItems, setLocalItems] = useState(readLocal);
  const [serverItems, setServerItems] = useState([]);
  const [loadedFor, setLoadedFor] = useState(null);
  const [error, setError] = useState('');

  const items = userId ? serverItems : localItems;
  const ready = authLoading ? false : userId ? loadedFor === userId : true;

  useEffect(() => {
    if (authLoading || !userId || loadedFor === userId) return undefined;

    let alive = true;
    syncCart(
      localItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
      })),
    )
      .then((data) => {
        if (alive) setServerItems(data.items.map(normalizeServer));
      })
      .catch(() => {
        if (!alive) return;
        getCart()
          .then((data) => alive && setServerItems(data.items.map(normalizeServer)))
          .catch(() => {});
      })
      .finally(() => {
        if (alive) setLoadedFor(userId);
      });

    return () => {
      alive = false;
    };
  }, [authLoading, userId, loadedFor, localItems]);

  useEffect(() => {
    if (!userId) localStorage.setItem(STORAGE_KEY, JSON.stringify(localItems));
  }, [localItems, userId]);

  const run = useCallback(
    async (request, localUpdate) => {
      setError('');
      if (!userId) {
        localUpdate();
        return;
      }
      try {
        setServerItems((await request()).items.map(normalizeServer));
      } catch (err) {
        setError(err.message);
      }
    },
    [userId],
  );

  const addItem = useCallback((product, quantity = 1, options = {}) => {
    const item = makeLocalItem(product, quantity, options);
    run(
      () =>
        addCartItem({
          productId: product._id,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
        }),
      () =>
        setLocalItems((current) => {
          const existing = current.find((entry) => entry.key === item.key);
          if (existing) {
            return current.map((entry) =>
              entry.key === item.key
                ? { ...entry, quantity: Math.min(entry.maxStock, entry.quantity + item.quantity) }
                : entry,
            );
          }
          return [...current, item];
        }),
    );
  }, [run]);

  const updateQuantity = useCallback((item, quantity) => {
    const qty = Math.max(1, Math.min(item.maxStock, Number(quantity) || 1));
    run(
      () =>
        setCartQuantity({
          productId: item.id,
          quantity: qty,
          color: item.color,
          size: item.size,
        }),
      () =>
        setLocalItems((current) =>
          current.map((entry) => (entry.key === item.key ? { ...entry, quantity: qty } : entry)),
        ),
    );
  }, [run]);

  const removeItem = useCallback((item) => {
    run(
      () => removeCartItem({ productId: item.id, color: item.color, size: item.size }),
      () => setLocalItems((current) => current.filter((entry) => entry.key !== item.key)),
    );
  }, [run]);

  const clearCart = useCallback(() => run(clearCartRequest, () => setLocalItems([])), [run]);

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return {
      items,
      count,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      ready,
      error,
    };
  }, [items, ready, error, addItem, updateQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
