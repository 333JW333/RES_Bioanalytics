import Image from "next/image";

const SOURCES = {
  color: "/brand/ecopeps-logo-compact.svg",
  reverse: "/brand/ecopeps-logo-compact-reverse.svg",
};

/**
 * Compact EcoPeps lockup (flat torus + wordmark) from the brand system in
 * brand/EcoPeps_Brand_System_v1. "color" is for light backgrounds,
 * "reverse" for navy. The artwork includes the guideline clear space.
 */
export default function Logo({
  variant = "color",
  className = "h-12 w-auto",
}: {
  variant?: keyof typeof SOURCES;
  className?: string;
}) {
  return (
    <Image
      src={SOURCES[variant]}
      alt="EcoPeps"
      width={920}
      height={280}
      className={className}
    />
  );
}
