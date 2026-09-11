"use client";

import { useState } from "react";
import Image from "next/image";
import { ProductImages } from "@/types/product";

export default function ProductGallery({
  images,
  name,
}: {
  images: ProductImages;
  name: string;
}) {
  const shots: { key: "front" | "back"; label: string; src: string }[] = [
    { key: "front", label: "Front", src: images.front },
    { key: "back", label: "Back", src: images.back },
  ];
  const [active, setActive] = useState<"front" | "back">("front");
  const activeShot = shots.find((s) => s.key === active) ?? shots[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-brand-line bg-brand-ice shadow-sm">
        <Image
          src={activeShot.src}
          alt={`${name} vial — ${activeShot.label.toLowerCase()}`}
          fill
          sizes="(min-width: 1024px) 480px, 90vw"
          className="object-contain p-10 sm:p-14"
          priority
        />
      </div>
      <div className="flex justify-center gap-3">
        {shots.map((shot) => (
          <button
            key={shot.key}
            type="button"
            onClick={() => setActive(shot.key)}
            aria-pressed={active === shot.key}
            className={`flex flex-col items-center gap-1.5 rounded-xl border bg-white p-2 transition-colors ${
              active === shot.key
                ? "border-brand-teal-dark ring-1 ring-brand-teal-dark"
                : "border-brand-line hover:border-brand-teal"
            }`}
          >
            <span className="relative h-16 w-16 overflow-hidden rounded-lg bg-brand-ice sm:h-20 sm:w-20">
              <Image
                src={shot.src}
                alt={`${name} vial thumbnail — ${shot.label.toLowerCase()}`}
                fill
                sizes="80px"
                className="object-contain p-2"
              />
            </span>
            <span
              className={`text-xs font-medium ${
                active === shot.key ? "text-brand-teal-dark" : "text-brand-slate-light"
              }`}
            >
              {shot.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
