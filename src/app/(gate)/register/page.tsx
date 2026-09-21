import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "Register",
  description:
    "Create your EcoPeps research account for instant catalog access.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return <RegisterClient />;
}
