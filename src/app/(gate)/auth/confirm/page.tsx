import type { Metadata } from "next";
import { confirmEmail } from "./actions";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
};

// Target of the "Confirm your email" link
// (ecopeps.com/auth/confirm?token_hash=...&type=email). The token is only
// spent when the visitor presses the button, not when the page loads:
// mail security scanners (university and corporate gateways) open links
// within seconds of delivery, and verifying on page load let them use up
// the one-time token before the recipient clicked.
export default async function ConfirmPage(
  props: PageProps<"/auth/confirm">
) {
  const { token_hash, type } = await props.searchParams;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-3.5 py-10 text-center sm:px-6">
      <div className="border border-brand-line bg-white px-6 py-8">
        <h1 className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-slate-light">
          Confirm your email
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-slate">
          Press the button below to confirm your email address and finish
          creating your account.
        </p>
        <form action={confirmEmail}>
          <input
            type="hidden"
            name="token_hash"
            value={typeof token_hash === "string" ? token_hash : ""}
          />
          <input
            type="hidden"
            name="type"
            value={typeof type === "string" ? type : ""}
          />
          <button
            type="submit"
            className="btn-primary mt-5 inline-flex min-h-11 items-center justify-center px-6"
          >
            Confirm email address
          </button>
        </form>
      </div>
    </main>
  );
}
