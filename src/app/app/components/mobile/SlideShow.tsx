"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { SlideRow } from "@/lib/mobile/types";

interface SlideShowProps {
  slides: SlideRow[];
  intervalMs?: number;
}

export default function SlideShow({ slides, intervalMs = 5000 }: SlideShowProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(
      () => setCurrent((prev) => (prev + 1) % slides.length),
      intervalMs
    );
    return () => clearInterval(id);
  }, [slides.length, intervalMs]);

  if (slides.length === 0) return null;

  return (
    <section className="mx-5 mt-5" aria-label="Slideshow masjid" aria-roledescription="carousel">
      <div className="relative rounded-3xl overflow-hidden h-48 bg-slate-800">
        <Image
          key={slides[current].id}
          src={slides[current].image_url}
          alt={`Slide masjid ${current + 1} dari ${slides.length}`}
          fill
          className="object-cover transition-opacity duration-500"
          sizes="(max-width: 430px) 100vw, 430px"
          unoptimized={slides[current].image_url.startsWith("http")}
          priority={current === 0}
        />

        {/* Dot indicators */}
        {slides.length > 1 && (
          <div
            className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5"
            role="tablist"
            aria-label="Navigasi slide"
          >
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === current}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  i === current ? "w-5 h-2 bg-emerald-400" : "w-2 h-2 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
