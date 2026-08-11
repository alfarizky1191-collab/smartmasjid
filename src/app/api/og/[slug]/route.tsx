import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const { data: mosque } = await supabase
    .from("mosques")
    .select("name, city, province")
    .eq("slug", decodedSlug)
    .single();

  if (!mosque) {
    return new ImageResponse(
      (
        <div style={{ background: "#07111f", color: "white", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
          <div style={{ fontSize: 54, fontWeight: 800 }}>SmartMasjid</div>
          <div style={{ marginTop: 18, fontSize: 28 }}>Informasi Masjid Digital</div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const location = [mosque.city, mosque.province].filter(Boolean).join(", ");

  return new ImageResponse(
    (
      <div style={{ background: "linear-gradient(135deg, #07111f 0%, #0f2f2a 100%)", color: "white", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "70px 80px", fontFamily: "sans-serif" }}>
        <div style={{ color: "#fbbf24", fontSize: 30, fontWeight: 700, letterSpacing: 2 }}>SMARTMASJID</div>
        <div style={{ marginTop: 34, fontSize: 62, lineHeight: 1.08, fontWeight: 800, maxWidth: 1040 }}>{mosque.name}</div>
        <div style={{ marginTop: 24, fontSize: 30, color: "#d1fae5" }}>Jadwal Sholat & Informasi Masjid</div>
        {location && <div style={{ marginTop: 22, fontSize: 25, color: "#cbd5e1" }}>{location}</div>}
        <div style={{ position: "absolute", bottom: 48, right: 80, fontSize: 22, color: "#94a3b8" }}>smartmasjid.biz.id</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
