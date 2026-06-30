import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import MosqueDirectory from "@/components/mosque/MosqueDirectory";
import type { Mosque } from "@/components/mosque/types";

export const metadata = {
  title: "Direktori Masjid | SmartMasjid",
  description: "Temukan masjid yang menggunakan SmartMasjid di seluruh Indonesia.",
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function MosqueDirectoryPage() {
  const { data, error } = await supabase
    .from("mosques")
    .select("id, name, slug, city, province, logo_url")
    .order("name");

  if (error) {
    // Log the actual error so it is visible in server logs
    console.error("[/masjid] Supabase error:", error);

    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-10 max-w-md text-center">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Terjadi Kesalahan</h1>
          <p className="text-slate-500 mt-2 mb-6">Gagal memuat daftar masjid. Silakan coba lagi.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-md"
          >
            ← Kembali ke Beranda
          </Link>
        </div>
      </main>
    );
  }

  // No error — render the directory (even if empty, MosqueDirectory handles it)
  return <MosqueDirectory mosques={(data as Mosque[]) ?? []} />;
}
