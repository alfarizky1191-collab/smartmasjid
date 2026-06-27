"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Slide } from "./types";

export default function SlideCarousel({ slides }: { slides: Slide[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <section aria-label="Slide masjid" className="py-8 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl shadow-md aspect-video bg-slate-100">
          {slides.map((s, i) => (
            <div
              key={s.id}
              className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
              aria-hidden={i !== current}
            >
              <Image
                src={s.image_url}
                alt={`Slide ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
              />
            </div>
          ))}

          {slides.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2" aria-hidden="true">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/40"}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
