// Shared by the header's My Account dropdown, the account sidebar, and the
// dashboard's section cards, so the three always list the same sections.
export const ACCOUNT_LINKS = [
  { href: "/account", label: "Dashboard", description: "Your account at a glance" },
  { href: "/account/orders", label: "Orders", description: "Order history and status" },
  { href: "/account/coas", label: "My COAs", description: "Certificates of analysis for your batches" },
  { href: "/account/addresses", label: "Addresses", description: "Shipping and billing addresses" },
  { href: "/account/details", label: "Account Details", description: "Your name, contact info and research profile" },
  { href: "/account/coupons", label: "Coupons", description: "Discount codes on your account" },
  { href: "/account/store-credits", label: "Store Credits", description: "Your store credit balance" },
] as const;

/** Dashboard matches /account only; every other section also matches its subpages. */
export function isAccountLinkActive(href: string, pathname: string): boolean {
  if (href === "/account") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
