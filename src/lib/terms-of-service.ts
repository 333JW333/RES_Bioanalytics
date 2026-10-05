/**
 * The EcoPeps Terms of Service. This is the single source for the
 * /legal/terms page and the Create Account scroll box, so both always show
 * the same text. Section numbers are added when rendering.
 */

/** A run of plain text, or a link to another page on this site. */
export type TermsTextRun = string | { text: string; href: string };

export type TermsSection = {
  title: string;
  /** One paragraph, written as text runs so it can link to other policies. */
  body: readonly TermsTextRun[];
  bullets?: readonly string[];
};

export const TERMS_LAST_UPDATED = "October 5, 2026";

const RUO_POLICY = { text: "Research Use Only Policy", href: "/legal/ruo-policy" };
const PRIVACY_POLICY = { text: "Privacy Policy", href: "/legal/privacy" };
const REFUND_POLICY = { text: "Refund Policy", href: "/legal/refunds" };
const SHIPPING_POLICY = { text: "Shipping & Handling", href: "/shipping" };

export const TERMS_OF_SERVICE: readonly TermsSection[] = [
  {
    title: "Agreement to Terms",
    body: [
      "By accessing this website, creating an account, or purchasing from EcoPeps (“EcoPeps,” “we,” “us”), you agree to be bound by these Terms of Service, our ",
      RUO_POLICY,
      ", our ",
      PRIVACY_POLICY,
      ", our ",
      REFUND_POLICY,
      ", and our ",
      SHIPPING_POLICY,
      " policy. If you do not agree, do not use this site or purchase our products.",
    ],
  },
  {
    title: "Eligibility",
    body: [
      "You must be at least 21 years old and purchasing on behalf of yourself, your laboratory, or your institution for lawful research purposes only. Our products are available exclusively to qualified individuals and organizations capable of handling research compounds safely.",
    ],
  },
  {
    title: "Intended Use and Product Restrictions",
    body: [
      "All products listed and sold by EcoPeps are strictly for laboratory and research use only. They are not intended for human or animal consumption, diagnostic purposes, or therapeutic application. All purchases are subject to our ",
      RUO_POLICY,
      ", and placing an order constitutes your certification that the products will be used solely for permitted research purposes.",
    ],
    bullets: [
      "No Regulatory Approval: The products sold here have not been evaluated by the U.S. Food and Drug Administration (FDA). They are not intended to diagnose, treat, cure, or prevent any disease.",
      "Compliance: You agree to handle all materials in strict compliance with all applicable local, state, and federal laws and regulations.",
      "Handling: Products are sold in lyophilized (powder) form. Research supplies (e.g., diluents, sterile equipment) are not included unless expressly listed.",
    ],
  },
  {
    title: "Policy on Human Consumption",
    body: [
      "We maintain a zero-tolerance policy regarding the bodily introduction of our products into humans or animals.",
    ],
    bullets: [
      "Communication Ban: Any communication (email, chat, or otherwise) that implies, requests advice on, or discusses the bodily administration, dosing, or consumption of these products will result in an immediate ban and order cancellation. We do not provide instructions for reconstitution or dosing for human or animal use.",
    ],
  },
  {
    title: "Account Termination",
    body: [
      "EcoPeps reserves the right to deny service, refuse orders, or terminate membership at its sole discretion for any reason, including but not limited to suspected misuse of products or violation of these terms.",
    ],
  },
  {
    title: "Product Descriptions",
    body: [
      "We strive to ensure product descriptions, purity data, and specifications are accurate. Product listings describe compound identity, purity, and form only, and do not make any performance, safety, or efficacy claims.",
    ],
  },
  {
    title: "Pricing & Payment",
    body: [
      "Prices are listed in U.S. Dollars and are subject to change without notice. We accept payment by cryptocurrency (processed by Coinbase Commerce), ACH bank transfer (processed via Plaid and Dwolla), and credit or debit card (processed by Stripe or PayRam). Additional payment methods, including PayPal, may be added in the future. Orders are not confirmed or shipped until payment has been received and, where applicable, settled.",
    ],
  },
  {
    title: "Cryptocurrency Payments",
    body: [
      "Cryptocurrency payments are final once confirmed on the applicable blockchain network. Due to the volatility of digital assets, the USD-equivalent price is locked at the time the invoice is generated; payments must be completed within the time window shown at checkout.",
    ],
  },
  {
    title: "ACH Bank Transfers",
    body: [
      "By initiating an ACH transfer you authorize EcoPeps and our payment processors (Plaid and Dwolla) to debit the linked bank account for the order total. Returned or reversed transfers may result in order cancellation and additional fees.",
    ],
  },
  {
    title: "Card Payments",
    body: [
      "Card payments are processed by our third-party payment processors, Stripe and PayRam. By paying with a card, you authorize EcoPeps and the processor handling your payment to charge your card for the order total. Refunds are handled under our ",
      REFUND_POLICY,
      ".",
    ],
  },
  {
    title: "Shipping, Returns, and Refunds",
    body: [
      "Shipping is governed by our ",
      SHIPPING_POLICY,
      " policy. Returns, replacements, and refunds are governed by our ",
      REFUND_POLICY,
      ".",
    ],
  },
  {
    title: "Disclaimer of Warranties",
    body: [
      "EcoPeps provides third-party and in-house testing data, including Certificates of Analysis, where available for informational purposes only. All materials are provided “as is” without warranty of any kind, express or implied. EcoPeps makes no representation regarding the accuracy, merchantability, or fitness for a particular purpose of any product.",
    ],
  },
  {
    title: "Limitation of Liability",
    body: [
      "To the maximum extent permitted by law, in no event shall EcoPeps, its owners, officers, or affiliates be liable for any damages—direct, indirect, consequential, or incidental—arising from the use, misuse, or inability to use our products or website, including any use inconsistent with our ",
      RUO_POLICY,
      ". The purchaser assumes full responsibility for all risks associated with the handling and experimentation of these compounds.",
    ],
  },
  {
    title: "Indemnification",
    body: [
      "You agree to defend, indemnify, and hold harmless EcoPeps from any claims, liabilities, damages, or costs (including legal fees) arising from your negligence, misuse of products, violation of these terms, or failure to comply with applicable laws.",
    ],
  },
  {
    title: "Privacy and Data",
    body: [
      "Your use of this site is also governed by our ",
      PRIVACY_POLICY,
      ", which outlines how we collect, store, and protect your personal information.",
    ],
  },
  {
    title: "Marketing Consent",
    body: [
      "By creating an account or placing an order, you consent to receive communications regarding order updates, product news, and promotions. You may opt out of marketing communications at any time via the “unsubscribe” link included in our emails.",
    ],
  },
  {
    title: "Governing Law",
    body: [
      "These terms shall be governed by and construed in accordance with the laws of the United States and the State of Idaho, without regard to conflict of law principles. Any legal action related to your access to or use of the site or products shall be brought in a court of competent jurisdiction in the State of Idaho.",
    ],
  },
  {
    title: "Modifications",
    body: [
      "EcoPeps reserves the right to update or modify these terms at any time without prior notice. Continued use of the website following any changes constitutes acceptance of the new terms.",
    ],
  },
  {
    title: "Contact",
    body: [
      "For inquiries regarding these Terms of Service or order status, email support@ecopeps.com or use our ",
      { text: "Contact page", href: "/contact" },
      ".",
    ],
  },
];
