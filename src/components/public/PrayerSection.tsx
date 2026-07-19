"use client";

import { useEffect, useState } from "react";
import SectionTitle from "./SectionTitle";
import Container from "./Container";

type PrayerEntry = { name: string; time: string | undefined };

async function fetchPrayerTimes(city: string): Promise<Record<string, string> | null> {
  try {
    const res = await fetch(
      `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=Indonesia&method=11`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.timings ?? null;
  } catch {
    return null;
  }
}

function getCurrentPrayer(prayers: PrayerEntry[]): string {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  let current = prayers[prayers.length - 1]?.name ?? "";
  for (const p of prayers) {
    if (!p.time) continue;
    const [h, m] = p.time.split(":").map(Number);
    if (nowMins >= h * 60 + m) current = p.name;
  }
  return current;
}

export default function PrayerSection({ city }: { city: string }) {
  const [prayers, setPrayers] = useState<PrayerEntry[]>([]);
  const [current, setCurrent] = useState("");
  const [countdown, setCountdown] = useState("");
  const [nextName, setNextName] = useState("");

  useEffect(() => {
    fetchPrayerTimes(city).then((t) => {
      if (!t) return;
      const list: PrayerEntry[] = [
        { name: "Subuh", time: t.Fajr },
        { name: "Dzuhur", time: t.Dhuhr },
        { name: "Ashar", time: t.Asr },
        { name: "Maghrib", time: t.Maghrib },
        { name: "Isya", time: t.Isha },
      ];
      setPrayers(list);
      setCurrent(getCurrentPrayer(list));
    });
  }, [city]);

  useEffect(() => {
    if (prayers.length === 0) return;
    const tick = () => {
      setCurrent(getCurrentPrayer(prayers));
      const now = new Date();
      for (const p of prayers) {
        if (!p.time) continue;
        const [h, m] = p.time.split(":").map(Number);
        const t = new Date();
        t.setHours(h, m, 0, 0);
        if (t > now) {
          const diff = Math.floor((t.getTime() - now.getTime()) / 1000);
          const hh = Math.floor(diff / 3600);
          const mm = Math.floor((diff % 3600) / 60);
          const ss = diff % 60;
          setNextName(p.name);
          setCountdown(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`);
          return;
        }
      }
      setNextName(prayers[0]?.name ?? "");
      setCountdown("--:--:--");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [prayers]);

  return (
    <section id="sholat" aria-labelledby="sholat-title" className="py-8 bg-slate-50">
      <Container>
        <SectionTitle>🕐 Waktu Sholat</SectionTitle>

        {countdown && (
          <div className="mb-6 bg-emerald-600 text-white rounded-3xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <p className="font-semibold text-emerald-100">Menuju {nextName}</p>
            <p className="text-4xl font-bold tracking-widest">{countdown}</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {prayers.map((p) => {
            const isActive = p.name === current;
            return (
              <div
                key={p.name}
                className={`rounded-2xl p-4 text-center shadow-sm transition-all ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-emerald-200"
                    : "bg-white text-slate-700"
                }`}
                aria-current={isActive ? "true" : undefined}
              >
                <p className={`text-sm font-semibold ${isActive ? "text-emerald-100" : "text-slate-500"}`}>
                  {p.name}
                </p>
                <p className="text-2xl font-bold mt-2">{p.time ?? "-"}</p>
              </div>
            );
          })}
        </div>

        {prayers.length === 0 && (
          <p className="text-slate-400 text-sm">Memuat jadwal sholat...</p>
        )}
      </Container>
    </section>
  );
}
