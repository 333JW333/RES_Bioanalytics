import type { Metadata } from "next";
import { RETURN_TO_PARAM, safeReturnPath } from "@/lib/return-to";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "Register",
  description:
    "Create your EcoPeps research account for instant catalog access.",
  robots: { index: false, follow: false },
};

export default async function RegisterPage(props: PageProps<"/register">) {
  const searchParams = await props.searchParams;
  return (
    <RegisterClient
      initialMode={searchParams.mode === "signin" ? "signin" : "register"}
      returnTo={safeReturnPath(searchParams[RETURN_TO_PARAM])}
    />
  );
}
