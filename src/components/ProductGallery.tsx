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
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-br from-brand-navy to-brand-navy-2 py-10">
        <Image
          src={activeShot.src}
          alt={`${name} vial — ${activeShot.label.toLowerCase()}`}
          width={340}
          height={340}
          className="h-56 w-56 object-contain drop-shadow-xl sm:h-64 sm:w-64"
          priority
        />
      </div>
      <div className="flex gap-3">
        {shots.map((shot) => (
          <button
            key={shot.key}
            type="button"
            onClick={() => setActive(shot.key)}
            aria-pressed={active === shot.key}
            className={`rounded-xl border p-1.5 transition-colors ${
              active === shot.key
                ? "border-brand-teal-dark"
                : "border-brand-line hover:border-brand-teal"
            }`}
          >
            <Image
              src={shot.src}
              alt={`${name} vial thumbnail — ${shot.label.toLowerCase()}`}
              width={56}
              height={56}
              className="h-14 w-14 rounded-lg object-contain"
            />
            <span className="sr-only">{shot.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
