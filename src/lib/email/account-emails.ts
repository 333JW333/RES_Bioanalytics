import { formatLocation, type RequestOrigin } from "@/lib/request-origin";
import { SUPPORT_EMAIL } from "@/lib/site";
import { renderEmail, type Block } from "./layout";
import type { EmailMessage } from "./send";

export interface NewAccountEmailData {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  businessType: string | null;
  industry: string | null;
  website: string | null;
  phone: string | null;
  einOnFile: boolean;
  signedUpAt: string | null;
  confirmedAt: string | null;
  /** How many accounts exist now, counting this one. */
  accountCount: number | null;
  origin: RequestOrigin;
  /** The Supabase project's dashboard, e.g. https://supabase.com/dashboard/project/<ref>. */
  supabaseDashboard: string | null;
}

/** Times in Mountain Time, matching the support hours on the contact page. */
export function mountainTime(iso: string | null): string {
  if (!iso) return "unknown";
  return `${new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Denver",
    dateStyle: "medium",
    timeStyle: "short",
  })} MT`;
}

/** Staff alert: someone confirmed their email and can now sign in and shop. */
export function staffNewAccountEmail(a: NewAccountEmailData): EmailMessage {
  const name = [a.firstName, a.lastName].filter(Boolean).join(" ") || null;
  const location = formatLocation(a.origin);

  const facts: [string, string][] = [
    ["Name", name ?? "(not given)"],
    ["Email", a.email],
    ["Business type", a.businessType ?? "(not given)"],
  ];
  if (a.industry) facts.push(["Industry", a.industry]);
  if (a.website) facts.push(["Website", a.website]);
  if (a.phone) facts.push(["Phone", a.phone]);
  facts.push(
    ["EIN on file", a.einOnFile ? "Yes (can request Net 30 invoices)" : "No"],
    ["Signed up", mountainTime(a.signedUpAt)],
    ["Confirmed", mountainTime(a.confirmedAt)],
    ["Approx. location", location ? `${location} (from IP address)` : "unknown"],
    ["IP address", a.origin.ip ?? "unknown"],
    ["Browser", a.origin.userAgent ?? "unknown"],
    ["Account ID", a.userId]
  );
  if (a.accountCount) facts.push(["Accounts in total", String(a.accountCount)]);

  const blocks: Block[] = [
    { facts },
    {
      p:
        "Worth a closer look before shipping: sign-ups from outside the U.S., throwaway-looking names, " +
        "or several accounts from the same IP address.",
    },
  ];
  if (a.supabaseDashboard) {
    blocks.push(
      {
        p:
          `To see everything this customer does (pages viewed, checkouts, orders, restock requests, inquiries), ` +
          `open Supabase's Table Editor, choose the "staff" schema, open customer_timeline and filter by ${a.email}. ` +
          `customer_activity has a one-row summary per account.`,
      },
      { link: { label: "Open Supabase Table Editor", url: `${a.supabaseDashboard}/editor` } }
    );
  }

  return renderEmail({
    audience: "staff",
    to: SUPPORT_EMAIL,
    subject: `New account confirmed: ${name ?? a.email}${location ? ` (${location})` : ""}`,
    heading: `${name ?? a.email} just confirmed a new EcoPeps account.`,
    blocks,
  });
}
