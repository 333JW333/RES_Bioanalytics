import { SUPPORT_EMAIL } from "@/lib/site";

/**
 * Sends EcoPeps' own emails through Resend (send-only key, restricted to
 * ecopeps.com). Order emails come from us, never from the payment processor,
 * so they keep working and look the same whichever processor takes payment.
 */

export const ORDERS_FROM = "EcoPeps Orders <orders@ecopeps.com>";

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  /** Defaults to support@ecopeps.com, so customer replies reach a person. */
  replyTo?: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Throws if Resend doesn't accept the message, so callers can retry. */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set.");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: ORDERS_FROM,
      to: Array.isArray(message.to) ? message.to : [message.to],
      reply_to: message.replyTo ?? SUPPORT_EMAIL,
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend rejected the email (${res.status}): ${detail.slice(0, 300)}`);
  }
}
