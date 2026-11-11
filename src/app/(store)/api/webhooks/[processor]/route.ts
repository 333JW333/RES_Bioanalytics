import { NextRequest, NextResponse } from "next/server";
import { applyPaymentUpdate } from "@/lib/order-lifecycle";
import { getProcessor } from "@/lib/payments/processors";
import { WebhookVerificationError, type WebhookResult } from "@/lib/payments/types";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Webhooks from every payment processor, at /api/webhooks/<processor id>
 * (Stripe: https://www.ecopeps.com/api/webhooks/stripe). The processor's
 * adapter checks the delivery is genuine and translates it; order status and
 * emails are then handled the same way whichever processor sent it.
 *
 * A non-2xx response makes the processor retry, which is what we want when
 * an update or an email fails partway.
 */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/webhooks/[processor]">) {
  const { processor: id } = await ctx.params;
  const processor = getProcessor(id);
  if (!processor) return NextResponse.json({ error: "Unknown payment processor." }, { status: 404 });

  // Signatures are computed over the exact bytes sent, so read the raw body.
  const rawBody = await req.text();
  let parsed: WebhookResult;
  try {
    parsed = await processor.parseWebhook(rawBody, req.headers);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.warn(`Rejected ${processor.name} webhook:`, err.message);
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }
    console.error(`${processor.name} webhook could not be read:`, err);
    return NextResponse.json({ error: "Webhook not processed." }, { status: 500 });
  }

  const admin = createAdminClient();

  // Processors can deliver the same event more than once: skip ones already
  // handled, retry ones that failed partway.
  const { data: seen } = await admin
    .from("payment_events")
    .select("processed_at")
    .eq("processor", processor.id)
    .eq("id", parsed.eventId)
    .maybeSingle<{ processed_at: string | null }>();
  if (seen?.processed_at) return NextResponse.json({ received: true, duplicate: true });
  if (!seen) {
    await admin
      .from("payment_events")
      .insert({ processor: processor.id, id: parsed.eventId, type: parsed.eventType });
  }

  try {
    for (const update of parsed.updates) await applyPaymentUpdate(processor, update);
  } catch (err) {
    console.error(`${processor.name} webhook ${parsed.eventType} (${parsed.eventId}) failed:`, err);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  await admin
    .from("payment_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("processor", processor.id)
    .eq("id", parsed.eventId);
  return NextResponse.json({ received: true });
}
