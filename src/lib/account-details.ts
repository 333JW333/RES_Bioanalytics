import { BUSINESS_TYPES, INDUSTRY_AFFILIATIONS } from "@/lib/gate";

/**
 * Rules for the details customers can change themselves on My Account →
 * Account Details (src/app/(store)/account/details). Same choices as the
 * registration form; the database enforces the lengths too.
 */

export interface DetailsInput {
  firstName: string;
  lastName: string;
  phone: string;
  website: string;
  businessType: string;
  industry: string;
  ein: string;
}

export type DetailsErrors = Partial<Record<keyof DetailsInput, string>>;

/** The profiles columns customers may update (see the account_details migration). */
export interface ProfileUpdate {
  first_name: string;
  last_name: string;
  phone: string;
  website: string | null;
  business_type: string;
  industry: string;
  ein: string | null;
}

export const LIMITS = { name: 100, phone: 30, website: 500 } as const;

const text = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");

export function readDetails(form: FormData): DetailsInput {
  return {
    firstName: text(form.get("firstName")),
    lastName: text(form.get("lastName")),
    phone: text(form.get("phone")),
    website: text(form.get("website")),
    businessType: text(form.get("businessType")),
    industry: text(form.get("industry")),
    ein: text(form.get("ein")),
  };
}

export function validateDetails(d: DetailsInput): { ok: true; update: ProfileUpdate } | { ok: false; errors: DetailsErrors } {
  const errors: DetailsErrors = {};

  if (!d.firstName) errors.firstName = "Enter your first name.";
  else if (d.firstName.length > LIMITS.name) errors.firstName = `Keep your first name under ${LIMITS.name} characters.`;
  if (!d.lastName) errors.lastName = "Enter your last name.";
  else if (d.lastName.length > LIMITS.name) errors.lastName = `Keep your last name under ${LIMITS.name} characters.`;

  if (!isPhone(d.phone)) errors.phone = "Enter a phone number with at least 7 digits.";

  if (d.website && !isWebsite(d.website)) errors.website = "Enter a website address, like example.com.";

  if (!(BUSINESS_TYPES as readonly string[]).includes(d.businessType)) errors.businessType = "Choose a business type.";
  if (!(INDUSTRY_AFFILIATIONS as readonly string[]).includes(d.industry)) {
    errors.industry = "Choose an industry / research affiliation.";
  }

  const ein = d.ein ? normalizeEin(d.ein) : null;
  if (d.ein && !ein) errors.ein = "Enter a 9-digit EIN, like 12-3456789.";

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    update: {
      first_name: d.firstName,
      last_name: d.lastName,
      phone: d.phone,
      website: d.website || null,
      business_type: d.businessType,
      industry: d.industry,
      ein,
    },
  };
}

/** 7–20 digits, written any common way: "(208) 555-0100", "+1 208 555 0100 ext 2". */
export function isPhone(v: string): boolean {
  if (!v || v.length > LIMITS.phone || !/^[0-9+().\-\s/a-zA-Z#]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 20;
}

/** A web address with or without https://, e.g. "lab.example.edu/research". */
export function isWebsite(v: string): boolean {
  if (v.length > LIMITS.website || /\s/.test(v)) return false;
  try {
    const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return (url.protocol === "https:" || url.protocol === "http:") && /\.[a-z]{2,}$/i.test(url.hostname);
  } catch {
    return false;
  }
}

/** "123456789" or "12-3456789" → "12-3456789"; anything else → null. */
export function normalizeEin(v: string): string | null {
  const digits = v.replace(/[\s-]/g, "");
  return /^\d{9}$/.test(digits) ? `${digits.slice(0, 2)}-${digits.slice(2)}` : null;
}

export function validateNewEmail(raw: unknown, current: string | null | undefined): { ok: true; email: string } | { ok: false; error: string } {
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (current && email === current.toLowerCase()) return { ok: false, error: "That's already your email address." };
  return { ok: true, email };
}

export function validateNewPassword(password: unknown, confirm: unknown): { ok: true; password: string } | { ok: false; error: string } {
  if (typeof password !== "string" || password.length < 8) {
    return { ok: false, error: "Your new password must be at least 8 characters." };
  }
  if (password.length > 72) return { ok: false, error: "Keep your password under 72 characters." };
  if (password !== confirm) return { ok: false, error: "The two passwords don't match." };
  return { ok: true, password };
}
