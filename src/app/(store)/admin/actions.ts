"use server";

import { redirect } from "next/navigation";
import { recordShipment, resendShipmentEmail } from "@/lib/order-lifecycle";
import { formatOrderRef } from "@/lib/orders";
import { sendBackInStockEmails } from "@/lib/restock-notify";
import { cleanTrackingNumber, isCarrier } from "@/lib/shipping";
import { getStaffUser } from "@/lib/staff";
import { lastHours, sendStaffReport } from "@/lib/staff-reports";

/**
 * Staff page actions. Each checks the caller is staff (actions can be called
 * directly, not just from the pages), then returns to the page with a
 * ?notice= code the page turns into a message.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function assertStaff(): Promise<void> {
  if (!(await getStaffUser())) throw new Error("Not authorized");
}

function back(path: string, params: Record<string, string | number>): never {
  const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  redirect(`${path}?${query}`);
}

export async function shipOrder(formData: FormData): Promise<void> {
  await assertStaff();
  const orderId = String(formData.get("orderId") ?? "");
  const carrier = formData.get("carrier");
  const trackingNumber = cleanTrackingNumber(formData.get("trackingNumber"));
  if (!UUID_RE.test(orderId)) back("/admin/orders", { notice: "save_failed" });
  const ref = formatOrderRef(orderId);
  if (!isCarrier(carrier) || !trackingNumber) back("/admin/orders", { notice: "bad_tracking", ref });

  let notice: string;
  try {
    const result = await recordShipment(orderId, carrier, trackingNumber);
    notice = result.saved === "not_shippable" ? "not_shippable" : `${result.saved}_${result.email}`;
  } catch (err) {
    console.error(`Marking order ${orderId} shipped failed`, err);
    notice = "save_failed";
  }
  back("/admin/orders", { notice, ref });
}

export async function resendShipped(formData: FormData): Promise<void> {
  await assertStaff();
  const orderId = String(formData.get("orderId") ?? "");
  if (!UUID_RE.test(orderId)) back("/admin/orders", { notice: "save_failed" });

  let notice: string;
  try {
    notice = `resent_${await resendShipmentEmail(orderId)}`;
  } catch (err) {
    console.error(`Resending the shipped email for order ${orderId} failed`, err);
    notice = "resent_failed";
  }
  back("/admin/orders", { notice, ref: formatOrderRef(orderId) });
}

export async function emailBackInStock(formData: FormData): Promise<void> {
  await assertStaff();
  const slug = String(formData.get("slug") ?? "").slice(0, 100);
  if (formData.get("confirm") !== "yes") back("/admin/restock", { notice: "confirm", slug });

  let params: Record<string, string | number>;
  try {
    const result = await sendBackInStockEmails(slug);
    params =
      result.status === "sent"
        ? { notice: result.failed ? "partial" : "sent", slug, sent: result.sent, failed: result.failed }
        : { notice: result.status, slug };
  } catch (err) {
    console.error(`Back-in-stock emails for ${slug} failed`, err);
    params = { notice: "failed", slug };
  }
  back("/admin/restock", params);
}

export async function sendSummaryNow(formData: FormData): Promise<void> {
  await assertStaff();
  const period = formData.get("period") === "weekly" ? "weekly" : "daily";
  let notice: string;
  try {
    notice = await sendStaffReport(period, lastHours(period));
  } catch (err) {
    console.error(`Sending the ${period} summary failed`, err);
    notice = "failed";
  }
  back("/admin", { notice: `summary_${notice}` });
}
