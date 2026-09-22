const AGE_KEY = "ecopeps-age-verified";
const AGE_COOKIE = "ecopeps-age";

export const BUSINESS_TYPES = [
  "Business / Institution (EIN Required)",
  "Independent Researcher / Sole Proprietor",
] as const;

export const INDUSTRY_AFFILIATIONS = [
  "Independent Researcher (Sole Proprietor)",
  "Industrial or Materials Research Lab",
  "University or Educational Institution",
  "Biotechnology Company",
  "Life Sciences Company",
  "Industrial/Manufacturing",
  "Contract Research Organization (CRO)",
  "Medical Devices R&D",
  "Government Research Facility",
  "Non-Profit Biomedical Research Org",
  "Environmental Testing Laboratory",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];
export type IndustryAffiliation = (typeof INDUSTRY_AFFILIATIONS)[number];

function setCookie(name: string, value: string, maxAgeDays = 365) {
  try {
    const maxAge = maxAgeDays * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    // ignore
  }
}

// Age/RUO confirmation on /enter is a lightweight UX gate ahead of the
// real account system, not a compliance record — it just decides whether
// to show the registration form. The actual "I certify research use only"
// acknowledgment made *during* registration is a real, stored fact (see
// profiles.terms_accepted_at, set from Supabase Auth user_metadata in
// RegisterClient.tsx), not client-only state.
export function readAgeVerified(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(AGE_KEY) === "true") return true;
    return document.cookie.split("; ").some((c) => c.startsWith(`${AGE_COOKIE}=1`));
  } catch {
    return false;
  }
}

export function writeAgeVerified(): void {
  try {
    window.localStorage.setItem(AGE_KEY, "true");
  } catch {
    // ignore
  }
  setCookie(AGE_COOKIE, "1");
}
