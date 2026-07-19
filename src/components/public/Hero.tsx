"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { MosquePublic } from "./types";

type PrayerEntry = {
  name: string;
  time: string;
};

async function fetchPrayerTimes(
  city: string
): Promise<Record<string, string> | null> {
  try {
    const res = await fetch(
      `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(
        city
      )}&country=Indonesia&method=11`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) return null;

    const json = await res.json();

    return json?.data?.timings ?? null;
  } catch {
    return null;
  }
}

function buildPrayers(
  timings: Record<string, string> | null
): PrayerEntry[] {
  if (!timings) return [];

  return [
    {
      name: "Subuh",
      time: timings.Fajr,
    },
    {
      name: "Dzuhur",
      time: timings.Dhuhr,
    },
    {
      name: "Ashar",
      time: timings.Asr,
    },
    {
      name: "Maghrib",
      time: timings.Maghrib,
    },
    {
      name: "Isya",
      time: timings.Isha,
    },
  ];
}

function getNextPrayer(prayers: PrayerEntry[]) {
  const now = new Date();

  for (const prayer of prayers) {
    const [hour, minute] = prayer.time
      .split(":")
      .map(Number);

    const target = new Date();

    target.setHours(hour, minute, 0, 0);

    if (target > now) {
      const diff = Math.floor(
        (target.getTime() - now.getTime()) / 1000
      );

      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;

      return {
        name: prayer.name,
        countdown:
          `${String(h).padStart(2, "0")}:` +
          `${String(m).padStart(2, "0")}:` +
          `${String(s).padStart(2, "0")}`,
      };
    }
  }

  if (prayers.length > 0) {
    const first = prayers[0];

    const [hour, minute] =
      first.time.split(":").map(Number);

    const tomorrow = new Date();

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );

    tomorrow.setHours(hour, minute, 0, 0);

    const diff = Math.floor(
      (tomorrow.getTime() - now.getTime()) / 1000
    );

    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;

    return {
      name: first.name,
      countdown:
        `${String(h).padStart(2, "0")}:` +
        `${String(m).padStart(2, "0")}:` +
        `${String(s).padStart(2, "0")}`,
    };
  }

  return {
    name: "-",
    countdown: "--:--:--",
  };
}

export default function Hero({
  mosque,
}: {
  mosque: MosquePublic;
}) {
  const [mounted, setMounted] =
    useState(false);

  const [now, setNow] =
    useState<Date | null>(null);

  const [prayers, setPrayers] =
    useState<PrayerEntry[]>([]);

  useEffect(() => {
    setMounted(true);

    const updateClock = () => {
      setNow(new Date());
    };

    updateClock();

    const timer = setInterval(
      updateClock,
      1000
    );

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!mosque.city) return;

    fetchPrayerTimes(
      mosque.city
    ).then((timings) => {
      setPrayers(
        buildPrayers(timings)
      );
    });
  }, [mosque.city]);

  const timeStr = useMemo(() => {
    if (!mounted || !now)
      return "--:--:--";

    return now.toLocaleTimeString(
      "id-ID",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );
  }, [mounted, now]);

  const dateStr = useMemo(() => {
    if (!mounted || !now)
      return "Memuat...";

    return now.toLocaleDateString(
      "id-ID",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }, [mounted, now]);

  const nextPrayer = useMemo(() => {
    return getNextPrayer(prayers);
  }, [prayers, now]);
    return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white">

      {/* Background Decoration */}

      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-300 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-8 px-6 py-14 text-center">

        {/* Logo */}

        {mosque.logo_url ? (
          <Image
            src={mosque.logo_url}
            alt={mosque.name}
            width={110}
            height={110}
            priority
            className="rounded-full border-4 border-white/40 object-cover shadow-2xl"
          />
        ) : (
          <div className="flex h-[110px] w-[110px] items-center justify-center rounded-full border-4 border-white/30 bg-white/20 text-5xl shadow-2xl">
            🕌
          </div>
        )}

        {/* Identity */}

        <div className="space-y-2">

          <h1 className="text-4xl font-bold">
            {mosque.name}
          </h1>

          <p className="text-lg text-emerald-100">
            {mosque.city}, {mosque.province}
          </p>

          <p className="text-sm text-emerald-200">
            {mosque.address}
          </p>

        </div>

        {/* Date & Clock */}

        <div className="rounded-3xl bg-white/10 px-8 py-5 backdrop-blur">

          <p className="text-sm text-emerald-100">
            {dateStr}
          </p>

          <p
            suppressHydrationWarning
            className="mt-2 text-5xl font-bold tracking-widest"
          >
            {timeStr}
          </p>

        </div>

        {/* Next Prayer */}

        <div className="w-full max-w-md rounded-3xl bg-white/15 p-8 shadow-xl backdrop-blur">

          <p className="text-sm uppercase tracking-[4px] text-emerald-100">
            Waktu Menuju
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {nextPrayer.name}
          </h2>

          <p
            suppressHydrationWarning
            className="mt-4 text-5xl font-bold tracking-widest"
          >
            {nextPrayer.countdown}
          </p>

        </div>

        {/* CTA */}

        <a
          href="#donasi"
          className="rounded-2xl bg-amber-400 px-8 py-4 text-lg font-bold text-slate-900 shadow-xl transition hover:bg-amber-500"
        >
          💛 Donasi Sekarang
        </a>

      </div>

    </section>
  );
}