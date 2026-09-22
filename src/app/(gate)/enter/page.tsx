import type { Metadata } from "next";
import EnterClient from "./EnterClient";

export const metadata: Metadata = {
  title: "Enter",
  description:
    "Confirm age and research-use eligibility to continue to EcoPeps registration.",
  robots: { index: false, follow: false },
};

export default async function EnterPage(props: PageProps<"/enter">) {
  const { mode } = await props.searchParams;
  return <EnterClient initialSignIn={mode === "signin"} />;
}
