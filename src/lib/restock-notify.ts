import { getProductBySlug } from "@/data/products";
import { backInStockEmail } from "@/lib/email/report-emails";
import { BATCH_LIMIT, isEmailConfigured, sendEmailBatch } from "@/lib/email/send";
import { isSoldOut } from "@/lib/pricing";
import { SITE_URL } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * "Back in stock" emails, sent from the staff Restock page (/admin/restock)
 * to everyone waiting on a product (restock_requests, src/lib/restock.ts).
 * Each person is emailed once: rows are marked notified before sending, and
 * unmarked again if their batch fails, so a retry picks them up.
 */

export type RestockSendResult =
  | { status: "sent"; sent: number; failed: number }
  | { status: "nobody_waiting" | "still_sold_out" | "unknown_product" | "email_off" };

/** Resend allows 2 requests a second. */
const PAUSE_MS = 600;

export async function sendBackInStockEmails(slug: string, admin = createAdminClient()): Promise<RestockSendResult> {
  const product = getProductBySlug(slug);
  if (!product) return { status: "unknown_product" };
  // The live catalog must already show it in stock, or the link leads to "Notify me".
  if (isSoldOut(product)) return { status: "still_sold_out" };
  if (!isEmailConfigured()) return { status: "email_off" };

  const { data, error } = await admin
    .from("restock_requests")
    .update({ notified_at: new Date().toISOString() })
    .eq("product_slug", product.slug)
    .is("notified_at", null)
    .select("id, email");
  if (error) throw new Error(`Could not claim restock requests for ${slug}: ${error.message}`);
  const rows = (data ?? []) as { id: string; email: string }[];
  if (rows.length === 0) return { status: "nobody_waiting" };

  const url = `${SITE_URL}/shop/${product.slug}`;
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < rows.length; i += BATCH_LIMIT) {
    const chunk = rows.slice(i, i + BATCH_LIMIT);
    if (i > 0) await new Promise((r) => setTimeout(r, PAUSE_MS));
    try {
      await sendEmailBatch(chunk.map((r) => backInStockEmail(r.email, product.name, url)));
      sent += chunk.length;
    } catch (err) {
      console.error(`Back-in-stock emails for ${slug} failed`, err);
      const { error: undoError } = await admin
        .from("restock_requests")
        .update({ notified_at: null })
        .in("id", chunk.map((r) => r.id));
      if (undoError) console.error(`Could not unmark restock requests for ${slug}`, undoError);
      failed += chunk.length;
    }
  }
  return { status: "sent", sent, failed };
}
