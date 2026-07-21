// Server Component — no interactivity; Google Maps link is a plain anchor.
import { MapPin, Navigation } from "lucide-react";

interface LocationCardProps {
  address: string | null;
  city: string | null;
  province: string | null;
  mosqueName?: string;
}

export default function LocationCard({
  address,
  city,
  province,
  mosqueName,
}: LocationCardProps) {
  const fullAddress = [address, city, province].filter(Boolean).join(", ");
  if (!fullAddress) return null;

  const mapsQuery = encodeURIComponent(
    [mosqueName, fullAddress].filter(Boolean).join(", ")
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <section className="mx-5 mt-5" aria-label="Lokasi Masjid">
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={15} className="text-yellow-400" strokeWidth={2} aria-hidden="true" />
        <h2 className="text-sm font-bold" style={{ color: "var(--pwa-text-primary)" }}>Lokasi</h2>
      </div>

      <div
        className="rounded-3xl border p-4"
        style={{
          background: "var(--pwa-bg-card)",
          borderColor: "var(--pwa-border-subtle)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <MapPin size={16} className="text-yellow-400" strokeWidth={2} />
          </div>
          <address className="flex-1 min-w-0 not-italic">
            <p
              className="text-sm font-medium leading-snug"
              style={{ color: "var(--pwa-text-primary)" }}
            >
              {fullAddress}
            </p>
          </address>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 w-full bg-yellow-500/10 border border-yellow-500/20 active:bg-yellow-500/20 text-yellow-400 font-bold text-sm rounded-2xl py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          aria-label={`Buka lokasi ${mosqueName ?? "masjid"} di Google Maps`}
        >
          <Navigation size={15} strokeWidth={2.5} aria-hidden="true" />
          Buka Google Maps
        </a>
      </div>
    </section>
  );
}
