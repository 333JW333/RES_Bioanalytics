import { NextRequest, NextResponse } from "next/server";
import { priceOrder } from "@/lib/pricing";
import {
  createDraftInvoice,
  createInvoiceItem,
  isStripeConfigured,
  toCents,
} from "@/lib/payments/stripe";
import {
  attestationEvidence,
  getOrCreateStripeCustomer,
  insertOrder,
  isInvoiceEligible,
  requireBuyer,
  updateOrder,
} from "@/lib/orders";

const NET_TERMS_DAYS = 30;
const SUPPORT_EMAIL = "support@ecopeps.com";

/**
 * Net 30 invoice request for business/institution accounts (EIN on file).
 *
 * This creates a DRAFT invoice (auto_advance off) and stops. Nothing is sent
 * to the buyer until staff review the order in the Stripe Dashboard and click
 * Send — extending credit is a decision a person should make, and it's the
 * point where you can check the institution, PO and shipping address.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireBuyer();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const { buyer } = auth;

    if (!isInvoiceEligible(buyer)) {
      return NextResponse.json(
        {
          error:
            "Invoicing is available to business and institution accounts with an EIN on file. Please pay by card, ACH or crypto, or contact us to upgrade your account.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    if (body?.ruoAttested !== true) {
      return NextResponse.json(
        { error: "Please confirm the research-use attestation before requesting an invoice." },
        { status: 400 }
      );
    }
    const poNumber =
      typeof body.poNumber === "string" ? body.poNumber.trim().slice(0, 100) : "";

    const order = priceOrder(body.items);
    if (!order.ok) return NextResponse.json({ error: order.error }, { status: 400 });
    const { lines } = order;
    const amountCents = lines.reduce((sum, l) => sum + toCents(l.unitPrice) * l.qty, 0);

    if (!isStripeConfigured()) {
      return NextResponse.json({ orderId: null, demo: true });
    }

    const customerId = await getOrCreateStripeCustomer(buyer);
    const orderId = await insertOrder({
      buyer,
      provider: "stripe_invoice",
      status: "invoice_requested",
      lines,
      amountCents,
      customerId,
      evidence: attestationEvidence(req),
      poNumber,
    });

    const customFields = [{ name: "Order", value: orderId.slice(0, 8).toUpperCase() }];
    if (poNumber) customFields.unshift({ name: "PO number", value: poNumber });

    const invoice = await createDraftInvoice(
      {
        customer: customerId,
        collection_method: "send_invoice",
        days_until_due: NET_TERMS_DAYS,
        auto_advance: false,
        pending_invoice_items_behavior: "exclude",
        custom_fields: customFields,
        footer:
          "All products are supplied for laboratory research use only and are not for human or animal consumption.",
        metadata: { order_id: orderId, user_id: buyer.userId },
      },
      `invoice-${orderId}`
    );

    for (const [i, l] of lines.entries()) {
      await createInvoiceItem(
        {
          customer: customerId,
          invoice: invoice.id,
          currency: "usd",
          amount: toCents(l.unitPrice) * l.qty,
          description: `${l.qty} × ${l.name} (${l.sizeLabel}) @ $${l.unitPrice.toFixed(2)} — SKU ${l.sku}`,
          metadata: { order_id: orderId, sku: l.sku },
        },
        `invoice-${orderId}-item-${i}`
      );
    }

    await updateOrder(orderId, { stripe_invoice_id: invoice.id });
    await notifyStaff(orderId, buyer.email, amountCents, poNumber, invoice.id);

    return NextResponse.json({ orderId, demo: false });
  } catch (err) {
    console.error("Stripe invoice request error:", err);
    return NextResponse.json(
      { error: "Unable to request an invoice. Please try again." },
      { status: 500 }
    );
  }
}

/** Best-effort heads-up so a draft invoice doesn't sit unreviewed. */
async function notifyStaff(
  orderId: string,
  buyerEmail: string,
  amountCents: number,
  poNumber: string,
  invoiceId: string
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`Invoice ${invoiceId} for order ${orderId} awaits review (RESEND_API_KEY unset).`);
    return;
  }
  const mode = process.env.STRIPE_SECRET_KEY?.includes("_test_") ? "test/" : "";
  const text = [
    `A Net ${NET_TERMS_DAYS} invoice was requested and is waiting for review.`,
    ``,
    `Order: ${orderId}`,
    `Buyer: ${buyerEmail}`,
    `Amount: $${(amountCents / 100).toFixed(2)}`,
    `PO number: ${poNumber || "(none)"}`,
    ``,
    `Review, then Send, in Stripe: https://dashboard.stripe.com/${mode}invoices/${invoiceId}`,
  ].join("\n");
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "EcoPeps Orders <orders@ecopeps.com>",
        to: [SUPPORT_EMAIL],
        subject: `Invoice request to review — order ${orderId.slice(0, 8).toUpperCase()}`,
        text,
      }),
    });
  } catch (err) {
    console.error("Could not email invoice request notice", err);
  }
}
