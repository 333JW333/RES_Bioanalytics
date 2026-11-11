import { stripeProcessor } from "./stripe-processor";
import type { PaymentProcessor } from "./types";

/**
 * Every payment processor the store can use. To add one, write an adapter
 * that implements PaymentProcessor (see stripe-processor.ts), list it here,
 * set PAYMENT_PROCESSOR to its id, and point its webhooks at
 * /api/webhooks/<id>. Keep the old one listed after a switch so its
 * refunds and disputes on earlier orders still arrive.
 */
const PROCESSORS = new Map<string, PaymentProcessor>([[stripeProcessor.id, stripeProcessor]]);

const DEFAULT_PROCESSOR = stripeProcessor.id;

/** A processor by id, as saved on orders and used in webhook URLs. */
export function getProcessor(id: string): PaymentProcessor | null {
  return PROCESSORS.get(id) ?? null;
}

/** The processor new orders go to: PAYMENT_PROCESSOR, or Stripe if unset. */
export function getActiveProcessor(): PaymentProcessor {
  const id = process.env.PAYMENT_PROCESSOR?.trim() || DEFAULT_PROCESSOR;
  const processor = getProcessor(id);
  if (!processor) throw new Error(`PAYMENT_PROCESSOR "${id}" is not a known payment processor.`);
  return processor;
}
