import Image from "next/image";

/**
 * Full EcoPeps lockup (torus mark + wordmark) for light backgrounds. The
 * dark-background version is pending from the designer, so the navy
 * footer still uses LogoMark.
 */
export default function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/brand/ecopeps-logo-full.png"
      alt="EcoPeps"
      width={1567}
      height={616}
      sizes="160px"
      className={className}
    />
  );
}
