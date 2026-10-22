import Link from "next/link";
import type { TermsTextRun } from "@/lib/terms-of-service";

/** Renders one Terms of Service paragraph, turning link runs into links. */
export default function TermsBody({
  body,
  linkClassName,
  newTab = false,
}: {
  body: readonly TermsTextRun[];
  linkClassName: string;
  /** Open links in a new tab, so a half-filled form isn't lost. */
  newTab?: boolean;
}) {
  return (
    <>
      {body.map((run, i) =>
        typeof run === "string" ? (
          run
        ) : (
          <Link
            key={i}
            href={run.href}
            className={linkClassName}
            target={newTab ? "_blank" : undefined}
            rel={newTab ? "noopener noreferrer" : undefined}
          >
            {run.text}
          </Link>
        )
      )}
    </>
  );
}
