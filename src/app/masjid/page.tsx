import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import MosqueDirectory from "@/components/mosque/MosqueDirectory";
import type { Mosque } from "@/components/mosque/types";

export const metadata = {
  title: "Cari Masjid | SmartMasjid",
  description: "Temukan masjid yang menggunakan SmartMasjid.",
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function MosqueDirectoryPage() {
  const { data, error } = await supabase
    .from("mosques")
    .select("id, name, slug, city, province, address, logo_url")
    .order("name");

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md text-center">
          <h1 className="text-2xl font-bold text-slate-800">Terjadi Kesalahan</h1>
          <p className="text-slate-500 mt-3">Gagal memuat daftar masjid.</p>
          <Link
            href="/"
            className="inline-block mt-6 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl"
          >
            Kembali
          </Link>
        </div>
      </main>
    );
  }

  return <MosqueDirectory mosques={(data as Mosque[]) ?? []} />;
}
