import Image from "next/image";

const LOCKUPS = {
  color: { src: "/brand/ecopeps-logo.png", width: 1200, height: 475 },
  reverse: { src: "/brand/ecopeps-logo-reverse.png", width: 1200, height: 473 },
};

/**
 * The designer's approved raster lockup (photoreal torus + wordmark) from
 * brand/EcoPeps_Brand_System_v1/00_Approved_Raster, trimmed to the artwork.
 * "color" is for light surfaces; "reverse" is the navy-background version
 * with that background keyed out, for navy surfaces. Both are transparent.
 *
 * Keep the rendered height at 44px or more: below that the torus drops
 * under the guidelines' 40px minimum for the detailed mark.
 */
export default function Logo({
  variant = "color",
  className = "h-12 w-auto",
}: {
  variant?: keyof typeof LOCKUPS;
  className?: string;
}) {
  const { src, width, height } = LOCKUPS[variant];
  return (
    <Image
      src={src}
      alt="EcoPeps"
      width={width}
      height={height}
      // Every placement renders it at most ~180px wide.
      sizes="180px"
      className={className}
    />
  );
}
