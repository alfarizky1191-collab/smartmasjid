import Image from "next/image";
import type { Donation, QrisSettings } from "./types";
import SectionTitle from "./SectionTitle";
import Container from "./Container";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export default function DonationSection({
  qris,
  donations,
}: {
  qris: QrisSettings | null;
  donations: Donation[];
}) {
  const total = donations.reduce((sum, d) => sum + (d.amount ?? 0), 0);

  return (
    <section id="donasi" aria-labelledby="donasi-title" className="py-8 bg-slate-50">
      <Container>
        <SectionTitle>💛 Donasi</SectionTitle>

        {qris?.image_url && (
          <div className="flex flex-col items-center mb-6">
            <p className="text-slate-600 text-sm mb-3">Scan QRIS untuk berdonasi</p>
            <Image
              src={qris.image_url}
              alt="QRIS Donasi"
              width={220}
              height={220}
              className="rounded-2xl border border-slate-200 shadow-md"
            />
            <a
              href={`#donasi`}
              className="mt-5 inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-8 py-4 rounded-2xl text-lg shadow transition-colors"
            >
              💛 Donasi Sekarang
            </a>
          </div>
        )}

        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between">
          <p className="text-slate-600 font-medium">Total Donasi</p>
          <p className="text-2xl font-bold text-emerald-700">{formatRupiah(total)}</p>
        </div>

        {donations.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-3">Donasi Terbaru</p>
            <div className="flex flex-col gap-2">
              {donations.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-xl bg-white border border-slate-100 px-4 py-3 shadow-sm">
                  <div>
                    <p className="font-medium text-slate-800">{d.donor_name?.trim() || "Hamba Allah"}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(d.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="font-bold text-emerald-700">{formatRupiah(d.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
