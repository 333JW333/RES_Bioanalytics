import { NextRequest, NextResponse } from "next/server";
import { priceOrder } from "@/lib/pricing";
import { demoPaymentsAllowed, paymentMethodUnavailable } from "@/lib/payments/demo-mode";
import { getActiveProcessor } from "@/lib/payments/processors";
import { notifyInvoiceRequested } from "@/lib/order-lifecycle";
import {
  amountCentsFor,
  attestationEvidence,
  checkoutBuyer,
  insertOrder,
  isInvoiceEligible,
  requireBuyer,
  updateOrder,
} from "@/lib/orders";

const NET_TERMS_DAYS = 30;

/**
 * Net 30 invoice request for business/institution accounts (EIN on file).
 *
 * The processor creates a DRAFT invoice and stops. Nothing is sent to the
 * buyer until staff review it in the processor's dashboard and send it:
 * extending credit is a decision a person should make, and it's the point
 * where you can check the institution, PO and shipping address. The buyer and
 * staff each get an EcoPeps email that the request came in.
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
            "Invoicing is available to business and institution accounts with an EIN on file. Please pay by card or bank account, or contact us to upgrade your account.",
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

    const processor = getActiveProcessor();
    if (!processor.isConfigured() || !processor.createInvoice) {
      if (!demoPaymentsAllowed()) return paymentMethodUnavailable();
      return NextResponse.json({ orderId: null, demo: true });
    }

    const orderId = await insertOrder({
      buyer,
      processor: processor.id,
      flow: "invoice",
      status: "invoice_requested",
      lines,
      amountCents: amountCentsFor(lines),
      evidence: attestationEvidence(req),
      poNumber,
    });

    const invoice = await processor.createInvoice({
      orderId,
      buyer: checkoutBuyer(buyer),
      lines,
      poNumber: poNumber || null,
      netDays: NET_TERMS_DAYS,
    });

    await updateOrder(orderId, {
      processor_invoice_id: invoice.invoiceId,
      processor_customer_id: invoice.customerId,
    });
    await notifyInvoiceRequested(processor, orderId);

    return NextResponse.json({ orderId, demo: false });
  } catch (err) {
    console.error("Invoice request error:", err);
    return NextResponse.json(
      { error: "Unable to request an invoice. Please try again." },
      { status: 500 }
    );
  }
}
