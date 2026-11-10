import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "EcoPeps Privacy Policy.",
};

const linkClass = "text-brand-teal-dark underline";

export default function PrivacyPage() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="text-3xl font-bold text-brand-navy mb-2">Privacy Policy</h1>
      <p className="text-sm text-brand-slate-light mb-8">Last updated: October 5, 2026</p>

      <div className="space-y-6 text-brand-slate leading-relaxed">
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">1. Information We Collect</h2>
          <p>We collect the following information when you use our site:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              <strong>Account registration:</strong> your name, email
              address, password, phone number, business type, industry
              affiliation, website, and the date you accepted our terms.
            </li>
            <li>
              <strong>Orders:</strong> your name, email address, the items
              you order, your shipping address, any purchase order number
              you provide, and a record of your research-use attestation,
              including when you made it and the IP address and browser
              information it was made from.
            </li>
            <li>
              <strong>Contact form:</strong> your name, email address,
              subject, order number (if provided), and message.
            </li>
            <li>
              <strong>Restock notifications:</strong> your email address and
              the product you asked to be notified about.
            </li>
            <li>
              <strong>Technical information:</strong> when you visit the
              site, our hosting and security providers automatically
              process information such as your IP address and browser type
              to deliver pages and block automated abuse.
            </li>
          </ul>
          <p className="mt-2">
            We do not collect or store your full card number or your bank
            login credentials. Card details are entered on payment pages
            hosted by our card processors and go directly to them. When you
            pay by ACH, Plaid and Dwolla collect and process your bank
            account information directly, and we receive only a tokenized
            reference. When you pay by cryptocurrency, Coinbase Commerce
            processes the transaction. In each case, the payment provider
            shares only limited information with us, such as whether your
            payment succeeded.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">2. How We Use Information</h2>
          <p>
            We use your information to create and manage your account,
            process and fulfill orders, issue invoices, respond to
            inquiries and provide customer support, notify you when
            products you requested are back in stock, prevent fraud and
            automated abuse, keep records of research-use attestations,
            comply with legal and regulatory obligations, and communicate
            with you about your order.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">3. Who We Share Information With</h2>
          <p>
            We share personal information only with the following parties,
            and only as needed for the purposes described above:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              <strong>Stripe</strong>, which processes our card payments
              and invoices (see section 4).
            </li>
            <li>
              <strong>Other payment processors:</strong> PayRam for card
              payments, Coinbase Commerce for cryptocurrency, and Plaid and
              Dwolla for ACH bank transfers, to complete transactions.
            </li>
            <li>
              <strong>Supabase</strong>, which provides our account sign-in
              and database, and stores your account details, orders,
              contact-form inquiries, and restock requests.
            </li>
            <li>
              <strong>Resend</strong>, which delivers contact-form messages
              and order notifications to our team.
            </li>
            <li>
              <strong>Cloudflare</strong>, whose Turnstile service checks
              that sign-up, sign-in, password reset, and contact-form
              submissions come from a real person.
            </li>
            <li>
              <strong>Vercel</strong>, which hosts this website.
            </li>
            <li>
              <strong>Shipping carriers</strong>, which receive your name and
              shipping address to deliver your order.
            </li>
            <li>
              <strong>Government authorities or other parties</strong>, when
              we are required to by law, subpoena, or court order, or when
              necessary to protect our rights or the safety of others.
            </li>
          </ul>
          <p className="mt-2">We do not sell your personal information to third parties.</p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">4. Payment Processing by Stripe</h2>
          <p>
            We use Stripe, Inc. (&ldquo;Stripe&rdquo;) to process card
            payments and invoices. When you pay by card, you enter your
            payment details on a checkout page hosted by Stripe, and those
            details go directly to Stripe; we never see or store your full
            card number. Invoices are delivered and paid through
            Stripe&apos;s hosted invoice pages.
          </p>
          <p className="mt-2">
            We share your name, email address, and order details with
            Stripe to create your payment or invoice. Stripe shares with us
            the shipping address you enter at checkout and the status of
            your payment.
          </p>
          <p className="mt-2">
            To process payments, detect and prevent fraud, and meet its
            legal and regulatory obligations, Stripe also collects
            information about your device and how you interact with its
            payment pages, such as your IP address, browser type, and
            activity on the page, and may set cookies for these purposes.
            Stripe processes some of this information as an independent
            data controller for fraud prevention, security, and compliance.
            For details, see the{" "}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className={linkClass}>
              Stripe Privacy Policy
            </a>{" "}
            and the{" "}
            <a href="https://stripe.com/cookies-policy/legal" target="_blank" rel="noopener noreferrer" className={linkClass}>
              Stripe Cookie Policy
            </a>
            .
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">5. How Information Is Shared</h2>
          <p>
            We share information with our service providers electronically,
            through their secure application programming interfaces (APIs)
            or hosted pages, over encrypted connections. Each provider
            receives only the information it needs to perform its service
            for us, and processes that information under its own privacy
            policy and terms. Payment details you enter on a provider&apos;s
            hosted page go directly to that provider and do not pass
            through our servers.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">6. How We Protect Your Information</h2>
          <p>We use the following safeguards to protect your information:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              All traffic between your browser and our site is encrypted
              using HTTPS (TLS).
            </li>
            <li>
              Card and bank details are handled by our payment processors;
              we never receive or store full card numbers or bank login
              credentials. Stripe is certified as a PCI Level 1 Service
              Provider, the highest level of certification in the payments
              industry.
            </li>
            <li>
              Account passwords are stored only in hashed form by our
              authentication provider. We cannot see your password.
            </li>
            <li>
              New accounts must verify their email address before they can
              sign in.
            </li>
            <li>
              Sign-up, sign-in, password reset, and contact forms are
              protected against automated abuse by Cloudflare Turnstile.
            </li>
            <li>
              Our database provider encrypts stored data at rest.
            </li>
            <li>
              The secret keys we use to connect to our payment and email
              providers are kept on our servers and are never exposed to
              your browser.
            </li>
            <li>
              Access to customer information within EcoPeps is limited to
              team members who need it to fulfill orders, provide customer
              support, or meet legal obligations, and they are required to
              keep it confidential. The accounts they use to reach customer
              information are protected with two-factor authentication, and
              we remove access promptly when it is no longer needed.
            </li>
          </ul>
          <p className="mt-2">
            No method of transmission or storage is completely secure, but
            we work to protect your information and will notify you as
            required by law if a breach affects your personal information.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">7. Data Retention</h2>
          <p>
            We retain account information while your account is active, and
            order, transaction, and research-use attestation records as
            required for accounting, tax, and regulatory compliance
            purposes.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">8. Your Choices</h2>
          <p>
            You may contact us at support@ecopeps.com to request
            access to, correction of, or deletion of your personal
            information, subject to our legal recordkeeping obligations.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">9. Cookies &amp; Local Storage</h2>
          <p>
            We use a small number of essential cookies to keep you signed
            in, remember that you completed our research-use confirmation,
            and return you to the page you were on after signing in. We also
            use browser local storage to remember your shopping cart and
            research-use confirmation; that data stays on your device. When
            you pay through Stripe, Stripe may set its own cookies to
            prevent fraud, as described in section 4. We do not use
            advertising or third-party analytics cookies.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-brand-navy text-lg mb-2">10. Contact</h2>
          <p>Questions about this policy can be directed to support@ecopeps.com.</p>
        </section>
      </div>
    </div>
  );
}
