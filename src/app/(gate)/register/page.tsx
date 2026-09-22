import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "Register",
  description:
    "Create your EcoPeps research account for instant catalog access.",
  robots: { index: false, follow: false },
};

export default async function RegisterPage(props: PageProps<"/register">) {
  const { mode } = await props.searchParams;
  return <RegisterClient initialMode={mode === "signin" ? "signin" : "register"} />;
}
