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
      {/* Section title */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-emerald-400 text-base leading-none" aria-hidden="true">✦</span>
        <h2 className="text-base font-bold" style={{ color: "var(--pwa-text-primary)" }}>Galeri Masjid</h2>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, var(--pwa-border-subtle), transparent)" }} aria-hidden="true" />
      </div>

      <div className="relative rounded-3xl overflow-hidden h-72 bg-slate-800">
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

        {/* Glass gradient overlay for dot indicators */}
        {slides.length > 1 && (
          <div
            className="absolute bottom-0 left-0 right-0 h-16"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
            }}
            aria-hidden="true"
          />
        )}

        {/* Dot indicators */}
        {slides.length > 1 && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5"
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
                  i === current ? "w-7 h-3 bg-emerald-400" : "w-3 h-3 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
