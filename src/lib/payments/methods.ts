/**
 * The payment methods EcoPeps accepts. Checkout shows only these, and the
 * routes of every other method refuse requests, so a hidden method can't be
 * used by calling its route directly. Used by both the checkout page and
 * the server; nothing secret here.
 *
 * Before enabling crypto, ACH (Plaid + Dwolla) or PayRam: their routes don't
 * yet require sign-in or the research-use attestation, and don't save an
 * order, the way the card and invoice routes do (src/lib/orders.ts). Add
 * those first, and have the legal pages reviewed (README: Switching payment
 * processors).
 */
export type PaymentMethod = "card" | "invoice" | "crypto" | "ach" | "payram";

export const ENABLED_METHODS: readonly PaymentMethod[] = ["card", "invoice"];

export function isMethodEnabled(method: PaymentMethod): boolean {
  return ENABLED_METHODS.includes(method);
}
