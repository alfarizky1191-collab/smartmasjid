import { MapPin, Navigation } from 'lucide-react';

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
  const fullLocation = locationParts.join(', ');
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullLocation)}`;

  return (
    <section className="mx-5 mt-5" aria-label="Lokasi Masjid">
      {/* Section header with Islamic ornament */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-blue-400 text-base leading-none" aria-hidden="true">✦</span>
        <h2 className="text-base font-bold" style={{ color: 'var(--pwa-text-primary)' }}>Lokasi</h2>
      </div>

      <div
        className="glass-card rounded-3xl overflow-hidden"
        style={{
          background: 'var(--pwa-bg-card)',
          border: '1px solid var(--pwa-border-subtle)',
        }}
      >
        {/* Address row */}
        <div className="flex items-start gap-4 px-5 py-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--pwa-bg-card-hover)', border: '1px solid rgba(96,165,250,0.15)' }}
          >
            <MapPin size={20} className="text-blue-400" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0 py-0.5">
            {address && (
              <p className="text-base font-medium leading-snug" style={{ color: 'var(--pwa-text-primary)' }}>
                {address}
              </p>
            )}
            {(city || province) && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--pwa-text-muted)' }}>
                {[city, province].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Google Maps button — larger touch target */}
        <div className="px-5 pb-5">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-blue-500/10 border border-blue-400/20 text-blue-400 text-base font-bold transition-colors active:bg-blue-500/20"
            aria-label={`Buka lokasi ${mosqueName ?? 'masjid'} di Google Maps`}
          >
            <Navigation size={18} strokeWidth={2.5} />
            Buka di Google Maps
          </a>
        </div>
      </div>
    </section>
  );
}
