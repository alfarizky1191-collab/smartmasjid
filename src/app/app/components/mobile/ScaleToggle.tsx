"use client";

import { useAppScale, type AppScale } from "@/hooks/useAppScale";

const OPTIONS: { value: AppScale; label: string }[] = [
  { value: "small",  label: "S" },
  { value: "medium", label: "M" },
  { value: "large",  label: "L" },
];

export default function ScaleToggle() {
  const { scale, setScale } = useAppScale();

  return (
    <div
      className="flex items-center rounded-xl overflow-hidden shrink-0"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
      role="group"
      aria-label="Ukuran teks"
    >
      {OPTIONS.map(({ value, label }) => {
        const isActive = scale === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setScale(value)}
            aria-pressed={isActive}
            aria-label={`Ukuran ${value}`}
            className="transition-all duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
            style={{
              width: 32,
              height: 28,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.05em",
              background: isActive
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "transparent",
              color: isActive ? "#fff" : "rgba(255,255,255,0.45)",
              borderRight: value !== "large" ? "1px solid rgba(255,255,255,0.08)" : undefined,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
