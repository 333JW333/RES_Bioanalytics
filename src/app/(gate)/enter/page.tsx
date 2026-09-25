import type { Metadata } from "next";
import { RETURN_TO_PARAM, safeReturnPath } from "@/lib/return-to";
import EnterClient from "./EnterClient";

export const metadata: Metadata = {
  title: "Enter",
  description:
    "Confirm age and research-use eligibility to continue to EcoPeps registration.",
  robots: { index: false, follow: false },
};

export default async function EnterPage(props: PageProps<"/enter">) {
  const searchParams = await props.searchParams;
  return <EnterClient returnTo={safeReturnPath(searchParams[RETURN_TO_PARAM])} />;
}
