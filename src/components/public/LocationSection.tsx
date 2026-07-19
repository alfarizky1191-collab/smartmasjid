import type { MosquePublic } from "./types";
import SectionTitle from "./SectionTitle";
import Container from "./Container";

export default function LocationSection({ mosque }: { mosque: MosquePublic }) {
  const mapsUrl = mosque.latitude && mosque.longitude
    ? `https://www.google.com/maps?q=${mosque.latitude},${mosque.longitude}`
    : `https://www.google.com/maps/search/${encodeURIComponent(mosque.name + " " + mosque.address)}`;

  return (
    <section id="lokasi" aria-labelledby="lokasi-title" className="py-8 bg-white">
      <Container>
        <SectionTitle>📍 Lokasi</SectionTitle>
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 shadow-sm">
          <p className="text-slate-700 font-medium">{mosque.address}</p>
          <p className="text-slate-500 text-sm mt-1">{mosque.city}, {mosque.province}</p>
          {mosque.latitude && mosque.longitude && (
            <p className="text-xs text-slate-400 mt-1">
              {mosque.latitude}, {mosque.longitude}
            </p>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-2xl transition-colors text-sm"
          >
            🗺️ Buka Google Maps
          </a>
        </div>
      </Container>
    </section>
  );
}
