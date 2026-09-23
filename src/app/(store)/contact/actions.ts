"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type InquiryState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "sent" };

const SUPPORT_EMAIL = "support@ecopeps.com";
const FROM = "EcoPeps Inquiry Form <inquiries@ecopeps.com>";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(formData: FormData, name: string, max: number): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// Supabase verifies Turnstile only for its own auth endpoints, so this
// form verifies its token against Cloudflare directly.
async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not set; rejecting inquiry");
    return false;
  }
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body }
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verification failed", err);
    return false;
  }
}

async function emailSupport(e: {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  orderNumber: string;
  message: string;
  signedIn: boolean;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set; inquiry saved but not emailed");
    return;
  }
  // Plain text only, so nothing the visitor typed is rendered as HTML.
  const text = [
    `Name: ${e.firstName} ${e.lastName}`.trim(),
    `Email: ${e.email}`,
    `Order number: ${e.orderNumber || "—"}`,
    `Signed in: ${e.signedIn ? "yes" : "no"}`,
    "",
    e.message,
  ].join("\n");
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [SUPPORT_EMAIL],
        reply_to: e.email,
        subject: `Inquiry: ${e.subject}`,
        text,
      }),
    });
    if (!res.ok) {
      console.error("Resend rejected inquiry email", res.status, await res.text());
    }
  } catch (err) {
    console.error("Sending inquiry email failed", err);
  }
}

export async function submitInquiry(
  _prev: InquiryState,
  formData: FormData
): Promise<InquiryState> {
  const firstName = field(formData, "firstName", 100);
  const lastName = field(formData, "lastName", 100);
  const email = field(formData, "email", 254).toLowerCase();
  const subject = field(formData, "subject", 200);
  const orderNumber = field(formData, "orderNumber", 100);
  const message = field(formData, "message", 5000);
  const agreed = formData.get("agree") === "on";
  const token = field(formData, "turnstileToken", 4096);

  if (!firstName || !email || !subject || !message) {
    return { status: "error", message: "Please fill in all required fields." };
  }
  if (!EMAIL_RE.test(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }
  if (!agreed) {
    return {
      status: "error",
      message: "Please confirm the research-use agreement to send your inquiry.",
    };
  }
  if (!token || !(await verifyTurnstile(token))) {
    return {
      status: "error",
      message:
        "The security check didn't go through. Wait for it to finish, then try again.",
    };
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub ?? null;

  // The table predates the switch to US spelling and keeps its original name.
  const { error } = await supabase.from("enquiries").insert({
    user_id: userId,
    first_name: firstName,
    last_name: lastName || null,
    email,
    subject,
    order_number: orderNumber || null,
    message,
    terms_accepted_at: new Date().toISOString(),
  });
  if (error) {
    console.error("Saving inquiry failed", error);
    return {
      status: "error",
      message: `We couldn't send your inquiry. Please try again, or email ${SUPPORT_EMAIL}.`,
    };
  }

  await emailSupport({
    firstName,
    lastName,
    email,
    subject,
    orderNumber,
    message,
    signedIn: userId !== null,
  });
  return { status: "sent" };
}
