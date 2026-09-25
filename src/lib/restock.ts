"use server";

import { getProductBySlug } from "@/data/products";
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
 * and RLS only accepts a row matching both.
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

  const { error } = await supabase.from("restock_requests").insert({
    user_id: userId,
    email,
    product_slug: product.slug,
  });
  if (error && error.code !== ALREADY_ON_LIST) {
    console.error("Saving restock request failed", error);
    return {
      status: "error",
      message: "We couldn't save your request. Please try again.",
    };
  }
  return { status: "subscribed", email };
}
