import type { OrderStatus } from "@/lib/orders";

/** How an order's status reads to the customer, and whether to show it at all. */
export interface CustomerOrderStatus {
  label: string;
  tone: "good" | "waiting" | "bad" | "neutral";
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Abandoned checkouts aren't orders to the customer: hide canceled ones,
 * and unpaid ones once their payment page has expired (a day).
 */
export function isVisibleToCustomer(status: OrderStatus, createdAt: string, now = Date.now()): boolean {
  if (status === "canceled") return false;
  if (status === "pending") return now - Date.parse(createdAt) < DAY_MS;
  return true;
}

export function customerOrderStatus(status: OrderStatus, shippedAt: string | null): CustomerOrderStatus {
  if (shippedAt && (status === "paid" || status === "partially_refunded")) {
    return { label: "Shipped", tone: "good" };
  }
  switch (status) {
    case "paid":
      return { label: "Paid, preparing to ship", tone: "good" };
    case "processing":
      return { label: "Bank payment processing", tone: "waiting" };
    case "pending":
      return { label: "Awaiting payment", tone: "waiting" };
    case "invoice_requested":
      return { label: "Invoice requested", tone: "waiting" };
    case "payment_failed":
      return { label: "Payment didn't go through", tone: "bad" };
    case "refunded":
      return { label: "Refunded", tone: "neutral" };
    case "partially_refunded":
      return { label: "Partially refunded", tone: "neutral" };
    case "disputed":
      return { label: "Payment under review", tone: "bad" };
    case "canceled":
      return { label: "Canceled", tone: "neutral" };
  }
}
