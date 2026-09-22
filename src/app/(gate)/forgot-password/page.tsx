import type { Metadata } from "next";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage(
  props: PageProps<"/forgot-password">
) {
  // Set by /auth/confirm when a reset link was expired or already used.
  const { expired } = await props.searchParams;
  return <ForgotPasswordClient linkExpired={expired === "1"} />;
}
