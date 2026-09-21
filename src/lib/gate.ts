export const AGE_KEY = "ecopeps-age-verified";
export const ACCOUNT_KEY = "ecopeps-account";
export const AGE_COOKIE = "ecopeps-age";
export const ACCESS_COOKIE = "ecopeps-access";

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

export type GateAccount = {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  institution: string;
  businessType: BusinessType | "";
  industry: IndustryAffiliation | "";
  website: string;
  phone: string;
};

function setCookie(name: string, value: string, maxAgeDays = 365) {
  try {
    const maxAge = maxAgeDays * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    // ignore
  }
}

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

export function readAccount(): GateAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GateAccount;
  } catch {
    return null;
  }
}

export function writeAccount(account: GateAccount): void {
  try {
    window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  } catch {
    // ignore
  }
  setCookie(ACCESS_COOKIE, "1");
}
