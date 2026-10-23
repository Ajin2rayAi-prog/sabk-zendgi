"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Product } from "@/data/catalog";

// ============================================================
//  سبد خرید سمت کلاینت (localStorage).
//  فقط محصولات دارای قیمت وارد سبد می‌شوند؛ اقلام «استعلام»
//  (price == null) از مسیر تماس تلفنی پیگیری می‌شوند.
// ============================================================

export type CartItem = {
  sku: string;
  slug: string;
  title: string;
  price: number; // ریال (همیشه دارای مقدار)
  image?: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  add: (product: Product, qty?: number) => void;
  remove: (sku: string) => void;
  setQty: (sku: string, qty: number) => void;
  clear: () => void;
  ready: boolean;
};

const STORAGE_KEY = "hassani-cart";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // بارگذاری اولیه از localStorage (بعد از mount تا هیدریشن خراب نشود)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {}
    setReady(true);
  }, []);

  // ذخیره در هر تغییر (فقط بعد از آماده‌شدن)
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const add = useCallback((product: Product, qty = 1) => {
    if (product.price == null) return; // اقلام استعلامی وارد سبد نمی‌شوند
    const price = product.price;
    setItems((prev) => {
      const existing = prev.find((i) => i.sku === product.sku);
      if (existing) {
        return prev.map((i) => (i.sku === product.sku ? { ...i, qty: i.qty + qty } : i));
      }
      return [
        ...prev,
        { sku: product.sku, slug: product.slug, title: product.title, price, image: product.image, qty },
      ];
    });
  }, []);

  const remove = useCallback((sku: string) => {
    setItems((prev) => prev.filter((i) => i.sku !== sku));
  }, []);

  const setQty = useCallback((sku: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.sku !== sku)
        : prev.map((i) => (i.sku === sku ? { ...i, qty } : i))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((n, i) => n + i.qty, 0);
  const total = items.reduce((n, i) => n + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, count, total, add, remove, setQty, clear, ready }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart باید داخل CartProvider استفاده شود");
  return ctx;
}
