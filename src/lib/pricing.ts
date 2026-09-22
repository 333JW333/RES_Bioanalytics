import { products } from "@/data/products";
import type { Product, ProductSize } from "@/types/product";

const MAX_LINE_QTY = 999;

export function discountedPrice(price: number, discountPercent: number): number {
  return Math.round(price * (1 - discountPercent / 100) * 100) / 100;
}

/** Discount from the highest volume tier the quantity reaches, or 0. */
export function volumeDiscountPercent(product: Product, qty: number): number {
  const tier = [...(product.volumeTiers ?? [])]
    .sort((a, b) => b.minQty - a.minQty)
    .find((t) => qty >= t.minQty);
  return tier?.discountPercent ?? 0;
}

export function findBySku(sku: string): { product: Product; size: ProductSize } | undefined {
  for (const product of products) {
    const size = product.sizes.find((s) => s.sku === sku);
    if (size) return { product, size };
  }
  return undefined;
}

/** Catalog unit price for a SKU at a line quantity, or undefined for an unknown SKU. */
export function unitPriceForSku(sku: string, qty: number): number | undefined {
  const match = findBySku(sku);
  if (!match) return undefined;
  return discountedPrice(match.size.price, volumeDiscountPercent(match.product, qty));
}

export interface PricedLine {
  sku: string;
  name: string;
  sizeLabel: string;
  qty: number;
  unitPrice: number;
}

export type PricedOrder =
  | { ok: true; lines: PricedLine[]; total: number }
  | { ok: false; error: string };

/**
 * Prices an order from the catalog. Only SKUs and quantities are taken from
 * the client; names, prices and volume discounts all come from
 * src/data/products.ts so the browser can't set what it pays.
 */
export function priceOrder(items: unknown): PricedOrder {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Cart is empty." };
  }

  // Merge repeated SKUs so the volume tier reflects the full quantity.
  const qtyBySku = new Map<string, number>();
  for (const item of items) {
    const sku = item?.sku;
    const qty = item?.qty;
    if (typeof sku !== "string" || !Number.isInteger(qty) || qty < 1) {
      return { ok: false, error: "Invalid cart item." };
    }
    qtyBySku.set(sku, (qtyBySku.get(sku) ?? 0) + qty);
  }

  const lines: PricedLine[] = [];
  for (const [sku, qty] of qtyBySku) {
    const match = findBySku(sku);
    if (!match || match.size.inStock === false) {
      return { ok: false, error: "An item in your cart is no longer available." };
    }
    if (qty > MAX_LINE_QTY) {
      return { ok: false, error: "Quantity too large." };
    }
    lines.push({
      sku,
      name: match.product.name,
      sizeLabel: match.size.label,
      qty,
      unitPrice: discountedPrice(
        match.size.price,
        volumeDiscountPercent(match.product, qty)
      ),
    });
  }

  const total =
    Math.round(lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0) * 100) / 100;
  if (total <= 0) return { ok: false, error: "Invalid order total." };

  return { ok: true, lines, total };
}
