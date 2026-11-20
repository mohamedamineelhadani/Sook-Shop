import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  addWishlist,
  removeWishlist,
  syncWishlist as syncWishlistRequest,
} from '../api/wishlist.js';
import { useAuth } from '../hooks/useAuth.js';
import { WishlistContext } from './wishlist-context.js';

const STORAGE_KEY = 'sookshop.wishlist.v1';

function normalizeProduct(product) {
  return {
    id: product.id || product._id,
    slug: product.slug || '',
    name: product.name || '',
    image: product.images?.[0] || product.image || '',
    price: Number(product.price) || 0,
    stock: Number(product.stock) || 99,
  };
}

function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeProduct) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
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
    syncWishlistRequest(localItems.map((item) => item.id))
      .then((data) => {
        if (alive) setServerItems(data.map(normalizeProduct));
      })
      .catch(() => {
        if (alive) setServerItems([]);
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

  const has = useCallback(
    (productId) => items.some((item) => item.id === productId),
    [items],
  );

  const run = useCallback(
    async (request, localUpdate) => {
      setError('');
      if (!userId) {
        localUpdate();
        return;
      }
      try {
        setServerItems((await request()).map(normalizeProduct));
      } catch (err) {
        setError(err.message);
      }
    },
    [userId],
  );

  const add = useCallback((product) => {
    const item = normalizeProduct(product);
    if (has(item.id)) return;
    run(
      () => addWishlist(item.id),
      () => setLocalItems((current) =>
        current.some((entry) => entry.id === item.id) ? current : [...current, item],
      ),
    );
  }, [has, run]);

  const remove = useCallback((product) => {
    const id = typeof product === 'string' ? product : product.id;
    run(
      () => removeWishlist(id),
      () => setLocalItems((current) => current.filter((entry) => entry.id !== id)),
    );
  }, [run]);

  const toggle = useCallback(
    (product) => (has(product.id || product._id) ? remove(product) : add(product)),
    [has, remove, add],
  );

  const clear = useCallback(
    () =>
      run(
        async () => {
          const current = [...items];
          for (const item of current) await removeWishlist(item.id);
          return [];
        },
        () => setLocalItems([]),
      ),
    [run, items],
  );

  const value = useMemo(
    () => ({ items, count: items.length, has, add, remove, toggle, clear, ready, error }),
    [items, ready, error, has, add, remove, toggle, clear],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
