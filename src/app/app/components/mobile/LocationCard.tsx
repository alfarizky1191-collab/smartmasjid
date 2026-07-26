import { MapPin, Navigation } from "lucide-react";

interface LocationCardProps {
  address?: string | null;
  city?: string | null;
  province?: string | null;
  mosqueName?: string | null;
}

export default function LocationCard({ address, city, province, mosqueName }: LocationCardProps) {
  const hasLocation = address || city || province;
  if (!hasLocation) return null;

  const locationParts = [address, city, province].filter(Boolean);
  const fullLocation = locationParts.join(", ");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullLocation)}`;

  return (
    <section className="mx-5" aria-label="Lokasi Masjid">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <MapPin size={18} className="text-blue-400" strokeWidth={2} aria-hidden="true" />
        <h2 className="text-lg font-bold tracking-wide" style={{ color: "var(--pwa-text-primary)" }}>
          Lokasi
        </h2>
        <div
          className="flex-1 h-px"
          style={{ background: "linear-gradient(to right, rgba(59,130,246,0.35), transparent)" }}
          aria-hidden="true"
        />
      </div>

      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--glass-border)",
          boxShadow: "0 4px 24px 0 var(--glass-shadow), inset 0 1px 0 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Address row */}
        <div className="flex items-start gap-4 px-5 py-5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: "rgba(59,130,246,0.12)",
              border: "1px solid rgba(59,130,246,0.25)",
            }}
            aria-hidden="true"
          >
            <MapPin size={22} className="text-blue-400" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0 py-0.5">
            {address && (
              <p className="text-base font-semibold leading-snug" style={{ color: "var(--pwa-text-primary)" }}>
                {address}
              </p>
            )}
            {(city || province) && (
              <p className="text-sm mt-1" style={{ color: "var(--pwa-text-muted)" }}>
                {[city, province].filter(Boolean).join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mx-5" style={{ background: "var(--glass-border)" }} aria-hidden="true" />

        {/* Google Maps button */}
        <div className="px-5 py-4">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl font-bold text-base text-blue-400 transition-all active:scale-[0.98]"
            style={{
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.25)",
            }}
            aria-label={`Buka lokasi ${mosqueName ?? "masjid"} di Google Maps`}
          >
            <Navigation size={20} strokeWidth={2.5} aria-hidden="true" />
            Buka di Google Maps
          </a>
        </div>
      </div>
    </section>
  );
}
