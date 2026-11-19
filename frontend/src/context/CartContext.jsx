import { useEffect, useMemo, useState } from 'react';

import { CartContext } from './cart-context.js';

const STORAGE_KEY = 'sookshop.cart.v1';

function readCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1) => {
    const qty = Math.max(1, Number(quantity) || 1);
    setItems((current) => {
      const existing = current.find((item) => item.id === product._id);
      if (existing) {
        return current.map((item) =>
          item.id === product._id
            ? { ...item, quantity: Math.min(item.maxStock, item.quantity + qty) }
            : item,
        );
      }
      return [
        ...current,
        {
          id: product._id,
          slug: product.slug,
          name: product.name,
          image: product.images?.[0] || '',
          price: product.price,
          quantity: qty,
          maxStock: product.stock || 99,
        },
      ];
    });
  };

  const updateQuantity = (id, quantity) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, Math.min(item.maxStock, Number(quantity) || 1)) }
          : item,
      ),
    );
  };

  const removeItem = (id) => setItems((current) => current.filter((item) => item.id !== id));
  const clearCart = () => setItems([]);

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { items, count, subtotal, addItem, updateQuantity, removeItem, clearCart };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
