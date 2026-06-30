"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import Adminsidebar from "@/components/Adminsidebar";
import { isKnownRole, canAccess, defaultRoute } from "@/lib/rbac";
import { extractStoragePath } from "@/lib/storage-utils";
import { logAuditAction } from "@/lib/audit";
import { formatRupiah, parseRupiah, formatRupiahInput } from "@/lib/currency-utils";
import { formatIndonesianDateWithDay } from "@/lib/date-utils";

// ─── Types ──────────────────────────────────────────────────────────────────────
interface Donation {
  id: string;
  donor_name: string | null;
  amount: number;
  note: string | null;
  mosque_id: string;
  created_at: string;
}

type SortKey = "newest" | "oldest" | "amount_desc" | "amount_asc";

// ─── CSV export (unchanged from previous implementation) ─────────────────────
function exportDonationsCSV(donations: Donation[], mosqueName: string) {
  if (donations.length === 0) {
    alert("Belum ada data donasi untuk diekspor.");
    return;
  }
  const headers = ["Nama Donatur", "Nominal", "Catatan", "Tanggal"];
  const rows = donations.map((d) => [
    d.donor_name || "Hamba Allah",
    formatRupiah(d.amount),
    d.note || "",
    d.created_at ? formatIndonesianDateWithDay(d.created_at) : "",
  ]);
  const totalRow = [
    "TOTAL",
    formatRupiah(donations.reduce((s, d) => s + (d.amount ?? 0), 0)),
    "",
    "",
  ];
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    `# Laporan Donasi - ${mosqueName}`,
    `# Diekspor: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`,
    "",
    headers.map(escape).join(","),
    ...rows.map((r) => r.map(escape).join(",")),
    totalRow.map(escape).join(","),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `donasi-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Delete confirmation modal ───────────────────────────────────────────────
interface DeleteModalProps {
  donation: Donation;
  onConfirm: () => void;
  onCancel: () => void;
}
function DeleteModal({ donation, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm mx-4 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-red-400">Hapus Donasi?</h2>
        <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-2 text-sm">
          <div>
            <span className="text-slate-400">Nama:</span>
            <p className="font-semibold mt-0.5">{donation.donor_name || "Hamba Allah"}</p>
          </div>
          <div>
            <span className="text-slate-400">Nominal:</span>
            <p className="font-semibold text-emerald-400 mt-0.5">{formatRupiah(donation.amount)}</p>
          </div>
          {donation.note && (
            <div>
              <span className="text-slate-400">Catatan:</span>
              <p className="mt-0.5">{donation.note}</p>
            </div>
          )}
        </div>
        <p className="text-slate-400 text-sm">
          Tindakan ini juga akan menghapus transaksi keuangan yang terkait.
        </p>
        <div className="flex gap-3 mt-1">
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded-xl font-semibold"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 py-2 rounded-xl font-semibold"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function DonasiPage() {
  const [mosqueId,   setMosqueId]   = useState<string | null>(null);
  const [mosqueName, setMosqueName] = useState("");

  // QRIS
  const [qrisFile, setQrisFile] = useState<File | null>(null);
  const [qrisUrl,  setQrisUrl]  = useState("");

  // Form state
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [donorName,     setDonorName]     = useState("");
  const [amount,        setAmount]        = useState(0);
  const [amountDisplay, setAmountDisplay] = useState("");
  const [note,          setNote]          = useState("");
  const [saving,        setSaving]        = useState(false);

  // Data
  const [donations, setDonations] = useState<Donation[]>([]);

  // Table controls
  const [search,  setSearch]  = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Donation | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // ─── Load donations ────────────────────────────────────────────────────────
  const loadDonations = async (mid: string) => {
    const { data } = await supabase
      .from("donations")
      .select("*")
      .eq("mosque_id", mid)
      .order("created_at", { ascending: false });
    if (data) setDonations(data as Donation[]);
  };

  // ─── Initialisation ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let donationChannel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) { if (!user) window.location.href = "/login"; return; }

      const { data } = await supabase
        .from("profiles")
        .select("mosque_id, role")
        .eq("id", user.id)
        .single();
      if (cancelled || !data?.mosque_id) return;

      const userRole = isKnownRole(data.role) ? data.role : "super_admin";
      if (!canAccess(userRole, "/dashboard/donasi")) {
        window.location.href = defaultRoute(userRole);
        return;
      }

      setMosqueId(data.mosque_id);
      await loadDonations(data.mosque_id);

      const { data: mosqueData } = await supabase
        .from("mosques")
        .select("name")
        .eq("id", data.mosque_id)
        .single();
      if (!cancelled && mosqueData?.name) setMosqueName(mosqueData.name);

      const { data: qrisData } = await supabase
        .from("qris_settings")
        .select("image_url")
        .eq("mosque_id", data.mosque_id)
        .single();
      if (!cancelled && qrisData?.image_url) setQrisUrl(qrisData.image_url);

      // Single realtime subscription — same as before
      const channel = supabase.channel(`donation-realtime-${data.mosque_id}-${Date.now()}`);
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "donations", filter: `mosque_id=eq.${data.mosque_id}` },
        () => { loadDonations(data.mosque_id); },
      );
      channel.subscribe();
      donationChannel = channel;
    };

    init();
    return () => {
      cancelled = true;
      if (donationChannel) supabase.removeChannel(donationChannel);
    };
  }, []);

  // ─── Currency input handler ────────────────────────────────────────────────
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setAmount(parseRupiah(raw));
    setAmountDisplay(formatRupiahInput(raw));
  };

  // ─── Clear / cancel edit ───────────────────────────────────────────────────
  const clearForm = () => {
    setEditingId(null);
    setDonorName("");
    setAmount(0);
    setAmountDisplay("");
    setNote("");
  };

  // ─── Load donation into form for editing ───────────────────────────────────
  const handleEdit = (d: Donation) => {
    setEditingId(d.id);
    setDonorName(d.donor_name || "");
    setAmount(d.amount);
    setAmountDisplay(formatRupiahInput(String(d.amount)));
    setNote(d.note || "");
    // Scroll to form
    document.getElementById("donation-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ─── Save (create or update) ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!mosqueId || !amount) { alert("Masukkan nominal donasi"); return; }
    setSaving(true);

    try {
      if (editingId) {
        // ── UPDATE ────────────────────────────────────────────────────────────
        // 1. Fetch old values so we can match the linked transaction
        const oldDonation = donations.find((d) => d.id === editingId);

        const { error: donError } = await supabase
          .from("donations")
          .update({ donor_name: donorName || null, amount, note: note || null })
          .eq("id", editingId)
          .eq("mosque_id", mosqueId);

        if (donError) { alert("Gagal update donasi: " + donError.message); return; }

        // 2. Update linked finance transaction.
        //    Match by: mosque_id + category="Donasi QRIS" + old title + old amount
        //    (This is the safest match without a FK column.)
        if (oldDonation) {
          const oldTitle = oldDonation.donor_name || "Hamba Allah";
          await supabase
            .from("transactions")
            .update({
              title:  donorName || "Hamba Allah",
              amount,
              note:   note || null,
            })
            .eq("mosque_id", mosqueId)
            .eq("category", "Donasi QRIS")
            .eq("title", oldTitle)
            .eq("amount", oldDonation.amount);
        }

        await logAuditAction({
          action: "Update Donation",
          module: "Donasi",
          metadata: { donation_id: editingId, donor_name: donorName || "Hamba Allah", amount },
        });

        alert("Donasi berhasil diupdate");
        clearForm();
        loadDonations(mosqueId);
      } else {
        // ── CREATE ────────────────────────────────────────────────────────────
        await supabase.from("donations").insert([{
          donor_name: donorName || null,
          amount,
          note: note || null,
          mosque_id: mosqueId,
        }]);

        await supabase.from("transactions").insert([{
          type:      "income",
          category:  "Donasi QRIS",
          title:     donorName || "Hamba Allah",
          amount,
          note:      note || null,
          mosque_id: mosqueId,
        }]);

        await logAuditAction({
          action: "Create Donation",
          module: "Donasi",
          metadata: { donor_name: donorName || "Hamba Allah", amount },
        });

        alert("Donasi berhasil ditambah");
        clearForm();
        loadDonations(mosqueId);
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !mosqueId) return;
    setDeleting(true);
    try {
      const donorTitle = deleteTarget.donor_name || "Hamba Allah";

      // Delete the donation row
      await supabase
        .from("donations")
        .delete()
        .eq("id", deleteTarget.id)
        .eq("mosque_id", mosqueId);

      // Delete the linked finance transaction
      await supabase
        .from("transactions")
        .delete()
        .eq("mosque_id", mosqueId)
        .eq("category", "Donasi QRIS")
        .eq("title", donorTitle)
        .eq("amount", deleteTarget.amount);

      await logAuditAction({
        action: "Delete Donation",
        module: "Donasi",
        metadata: {
          donation_id: deleteTarget.id,
          donor_name: donorTitle,
          amount: deleteTarget.amount,
        },
      });

      setDeleteTarget(null);
      loadDonations(mosqueId);
    } finally {
      setDeleting(false);
    }
  };

  // ─── Upload QRIS (unchanged) ───────────────────────────────────────────────
  const uploadQris = async () => {
    if (!qrisFile) return;
    const fileName = `${mosqueId}/${Date.now()}-${qrisFile.name}`;
    await supabase.storage.from("qris").upload(fileName, qrisFile);
    const publicUrl = supabase.storage.from("qris").getPublicUrl(fileName).data.publicUrl;
    setQrisUrl(publicUrl);
    const oldPath = extractStoragePath(qrisUrl, "qris", mosqueId!);
    if (oldPath) await supabase.storage.from("qris").remove([oldPath]);
    await supabase.from("qris_settings").upsert(
      [{ mosque_id: mosqueId, image_url: publicUrl }],
      { onConflict: "mosque_id" },
    );
    await logAuditAction({ action: "QRIS Update", module: "QRIS", metadata: { file_name: qrisFile.name } });
    alert("QRIS berhasil upload");
  };

  // ─── Derived statistics ────────────────────────────────────────────────────
  const totalDonations  = donations.reduce((s, d) => s + (d.amount ?? 0), 0);
  const donorCount      = donations.length;

  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const todayTotal = donations
    .filter((d) => d.created_at?.slice(0, 10) === todayKey)
    .reduce((s, d) => s + (d.amount ?? 0), 0);

  const monthKey = todayKey.slice(0, 7); // "YYYY-MM"
  const monthTotal = donations
    .filter((d) => d.created_at?.slice(0, 7) === monthKey)
    .reduce((s, d) => s + (d.amount ?? 0), 0);

  // ─── Filtered + sorted view ────────────────────────────────────────────────
  const filteredDonations = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = donations.filter((d) => {
      if (!q) return true;
      return (
        (d.donor_name || "").toLowerCase().includes(q) ||
        (d.note || "").toLowerCase().includes(q)
      );
    });

    switch (sortKey) {
      case "newest":      result = [...result].sort((a, b) => b.created_at.localeCompare(a.created_at)); break;
      case "oldest":      result = [...result].sort((a, b) => a.created_at.localeCompare(b.created_at)); break;
      case "amount_desc": result = [...result].sort((a, b) => b.amount - a.amount); break;
      case "amount_asc":  result = [...result].sort((a, b) => a.amount - b.amount); break;
    }

    return result;
  }, [donations, search, sortKey]);

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-950 text-white flex">
      <Adminsidebar />

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          donation={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">

          <h1 className="text-5xl font-bold text-emerald-400">QRIS Donasi</h1>

          {/* ── STATISTICS CARDS ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-sm text-slate-400">Total Donasi</p>
              <p className="text-xl font-bold text-emerald-400 mt-1 break-all">{formatRupiah(totalDonations)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-sm text-slate-400">Jumlah Donatur</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{donorCount}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-sm text-slate-400">Donasi Hari Ini</p>
              <p className="text-xl font-bold text-emerald-400 mt-1 break-all">{formatRupiah(todayTotal)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-sm text-slate-400">Donasi Bulan Ini</p>
              <p className="text-xl font-bold text-emerald-400 mt-1 break-all">{formatRupiah(monthTotal)}</p>
            </div>
          </div>

          {/* ── QRIS UPLOAD ──────────────────────────────────────────────── */}
          <div className="bg-slate-900 rounded-3xl p-6 flex flex-col gap-4">
            <h2 className="text-3xl font-bold text-emerald-400">Upload QRIS</h2>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setQrisFile(e.target.files?.[0] || null)}
              className="bg-slate-800 p-4 rounded-2xl"
            />
            <button
              onClick={uploadQris}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold p-4 rounded-2xl"
            >
              Upload QRIS
            </button>
            {qrisUrl && (
              <img src={qrisUrl} alt="QRIS" className="w-96 rounded-3xl border-4 border-emerald-400" />
            )}
          </div>

          {/* ── ADD / EDIT FORM ───────────────────────────────────────────── */}
          <div id="donation-form" className="bg-slate-900 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-3xl font-bold text-emerald-400">
                {editingId ? "Edit Donasi" : "Tambah Donasi"}
              </h2>
              {editingId && (
                <button
                  onClick={clearForm}
                  className="text-sm text-slate-400 hover:text-white underline"
                >
                  Batal
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Nama Donatur (opsional)"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className="bg-slate-800 p-4 rounded-2xl"
            />

            {/* Currency input */}
            <input
              type="text"
              inputMode="numeric"
              placeholder="Rp 0"
              value={amountDisplay}
              onChange={handleAmountChange}
              className="bg-slate-800 p-4 rounded-2xl"
            />

            <textarea
              placeholder="Catatan"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-slate-800 p-4 rounded-2xl min-h-[100px]"
            />

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-black font-bold p-4 rounded-2xl"
            >
              {saving ? "Menyimpan..." : editingId ? "Update Donasi" : "Simpan Donasi"}
            </button>
          </div>

          {/* ── DONATION TABLE ────────────────────────────────────────────── */}
          <div className="bg-slate-900 rounded-3xl p-6">
            {/* Header row: title + export */}
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <h2 className="text-3xl font-bold text-emerald-400">Riwayat Donasi</h2>
              <button
                onClick={() => exportDonationsCSV(donations, mosqueName)}
                className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl font-semibold text-sm flex items-center gap-2"
              >
                📥 Export CSV
              </button>
            </div>

            {/* Search + sort controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <input
                type="text"
                placeholder="Cari nama donatur atau catatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="amount_desc">Nominal terbesar</option>
                <option value="amount_asc">Nominal terkecil</option>
              </select>
            </div>

            {/* Empty state */}
            {donations.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-2 text-center">
                <p className="text-xl font-semibold text-slate-300">Belum ada donasi</p>
                <p className="text-slate-500 text-sm">Tidak ada data donasi untuk masjid ini.</p>
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-center">
                <p className="text-slate-400">Tidak ada hasil untuk pencarian &ldquo;{search}&rdquo;</p>
              </div>
            ) : (
              /* Responsive table */
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-3 px-3 text-left font-semibold w-10">No.</th>
                      <th className="py-3 px-3 text-left font-semibold">Nama Donatur</th>
                      <th className="py-3 px-3 text-right font-semibold">Nominal</th>
                      <th className="py-3 px-3 text-left font-semibold hidden md:table-cell">Catatan</th>
                      <th className="py-3 px-3 text-left font-semibold hidden lg:table-cell">Tanggal</th>
                      <th className="py-3 px-3 text-center font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonations.map((item, idx) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-3 font-medium">
                          {item.donor_name || <span className="text-slate-500 italic">Hamba Allah</span>}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-400">
                          {formatRupiah(item.amount)}
                        </td>
                        <td className="py-3 px-3 text-slate-400 hidden md:table-cell max-w-[180px] truncate">
                          {item.note || <span className="text-slate-600">—</span>}
                        </td>
                        <td className="py-3 px-3 text-slate-400 hidden lg:table-cell whitespace-nowrap">
                          {item.created_at ? formatIndonesianDateWithDay(item.created_at) : "—"}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
