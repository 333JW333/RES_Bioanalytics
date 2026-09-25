"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { unitPriceForSku } from "@/lib/pricing";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  sizeLabel: string;
  sku: string;
  unitPrice: number;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty" | "unitPrice">, qty?: number) => void;
  removeItem: (sku: string) => void;
  updateQty: (sku: string, qty: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  isHydrated: boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "ecopeps-cart";

// Unit prices always come from the catalog at the line's current quantity,
// so volume discounts track quantity changes and match what checkout
// charges. Returns null for SKUs no longer in the catalog or in stock.
function withCatalogPrice(item: Omit<CartItem, "unitPrice">): CartItem | null {
  const unitPrice = unitPriceForSku(item.sku, item.qty);
  return unitPrice === undefined ? null : { ...item, unitPrice };
}

function repriceAll(items: Omit<CartItem, "unitPrice">[]): CartItem[] {
  return items.flatMap((i) => withCatalogPrice(i) ?? []);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // One-time hydration from localStorage on mount (SSR-safe: window is
    // unavailable during server render, so this can't run there).
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(repriceAll(JSON.parse(raw)));
    } catch {
      // ignore corrupted storage
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable; cart stays in-memory for this session
    }
  }, [items, isHydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "qty" | "unitPrice">, qty = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.sku === item.sku);
        if (existing) {
          return repriceAll(
            prev.map((i) => (i.sku === item.sku ? { ...i, qty: i.qty + qty } : i))
          );
        }
        return repriceAll([...prev, { ...item, qty }]);
      });
    },
    []
  );

  const removeItem = useCallback((sku: string) => {
    setItems((prev) => prev.filter((i) => i.sku !== sku));
  }, []);

  const updateQty = useCallback((sku: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.sku !== sku)
        : repriceAll(prev.map((i) => (i.sku === sku ? { ...i, qty } : i)))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.qty, 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    subtotal,
    itemCount,
    isHydrated,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
