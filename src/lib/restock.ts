"use server";

import { getProductBySlug } from "@/data/products";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type RestockState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "subscribed"; email: string };

// Postgres unique_violation: this customer is already on the product's list.
const ALREADY_ON_LIST = "23505";

/**
 * "Notify me when available" on an out-of-stock product page. Adds the
 * signed-in customer to the product's list in the Supabase
 * restock_requests table (demand per product: the restock_demand view).
 * The account and email come from the verified session, never the form,
 * and the product must be in the catalog.
 */
export async function requestRestockNotice(
  _prev: RestockState,
  formData: FormData
): Promise<RestockState> {
  const slug = formData.get("slug");
  const product = typeof slug === "string" ? getProductBySlug(slug) : undefined;
  if (!product) {
    return { status: "error", message: "We couldn't find that product." };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const email = data?.claims?.email;
  if (!userId || typeof email !== "string" || !email) {
    return { status: "error", message: "Please sign in again to get notified." };
  }

  // Saved with the secret key, after the checks above: the API roles can't
  // insert into restock_requests (migration 20261112090000), so nobody can
  // add rows for products that aren't in the catalog by writing directly.
  let error: { code?: string; message?: string } | null = null;
  try {
    ({ error } = await createAdminClient().from("restock_requests").insert({
      user_id: userId,
      email,
      product_slug: product.slug,
    }));
  } catch (err) {
    error = { message: err instanceof Error ? err.message : String(err) };
  }
  if (error && error.code !== ALREADY_ON_LIST) {
    console.error("Saving restock request failed", error);
    return {
      status: "error",
      message: "We couldn't save your request. Please try again.",
    };
  }
  return { status: "subscribed", email };
}
