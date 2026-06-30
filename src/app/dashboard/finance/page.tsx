"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import Adminsidebar from "@/components/Adminsidebar";
import { formatIndonesianDateWithDay } from "@/lib/date-utils";
import { isKnownRole, canAccess, defaultRoute } from "@/lib/rbac";
import { logAuditAction } from "@/lib/audit";
import { formatRupiah, parseRupiah, formatRupiahInput } from "@/lib/currency-utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Transaction {
  id: string;
  type: string;
  category: string;
  title: string;
  amount: number;
  note: string | null;
  mosque_id: string;
  created_at: string;
}

type SortKey = "newest" | "oldest" | "amount_desc" | "amount_asc";

// ─── Delete confirmation modal ────────────────────────────────────────────────
interface DeleteModalProps {
  transaction: Transaction;
  onConfirm: () => void;
  onCancel: () => void;
}
function DeleteModal({ transaction, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm mx-4 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-red-400">Hapus transaksi?</h2>
        <div className="bg-slate-800 rounded-xl p-4 flex flex-col gap-2 text-sm">
          <div>
            <span className="text-slate-400">Judul:</span>
            <p className="font-semibold mt-0.5">{transaction.title}</p>
          </div>
          <div>
            <span className="text-slate-400">Nominal:</span>
            <p className={`font-semibold mt-0.5 ${transaction.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
              {formatRupiah(transaction.amount)}
            </p>
          </div>
        </div>
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


// ─── Main component ───────────────────────────────────────────────────────────
export default function FinancePage() {
  const [mosqueId,   setMosqueId]   = useState<string | null>(null);
  const [mosqueName, setMosqueName] = useState("");

  // Form state
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [type,          setType]          = useState("income");
  const [category,      setCategory]      = useState("");
  const [title,         setTitle]         = useState("");
  const [amount,        setAmount]        = useState(0);
  const [amountDisplay, setAmountDisplay] = useState("");
  const [note,          setNote]          = useState("");
  const [saving,        setSaving]        = useState(false);

  // Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Table controls
  const [search,  setSearch]  = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // ─── Load ──────────────────────────────────────────────────────────────────
  const loadTransactions = async (mid: string) => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("mosque_id", mid)
      .order("created_at", { ascending: false });
    if (data) setTransactions(data as Transaction[]);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data } = await supabase
        .from("profiles")
        .select("mosque_id, role")
        .eq("id", user.id)
        .single();
      if (data?.mosque_id) {
        const userRole = isKnownRole(data.role) ? data.role : "super_admin";
        if (!canAccess(userRole, "/dashboard/finance")) {
          window.location.href = defaultRoute(userRole);
          return;
        }
        setMosqueId(data.mosque_id);
        await loadTransactions(data.mosque_id);
        const { data: mosqueData } = await supabase
          .from("mosques").select("name").eq("id", data.mosque_id).single();
        if (mosqueData?.name) setMosqueName(mosqueData.name);
      }
    };
    init();
  }, []);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setAmount(parseRupiah(raw));
    setAmountDisplay(formatRupiahInput(raw));
  };

  const clearForm = () => {
    setEditingId(null);
    setType("income");
    setCategory("");
    setTitle("");
    setAmount(0);
    setAmountDisplay("");
    setNote("");
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    setType(t.type);
    setCategory(t.category);
    setTitle(t.title);
    setAmount(t.amount);
    setAmountDisplay(formatRupiahInput(String(t.amount)));
    setNote(t.note || "");
    document.getElementById("finance-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ─── Save (create or update) ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!mosqueId || !title || !category || !amount) {
      alert("Lengkapi data");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("transactions")
          .update({ type, category, title, amount, note: note || null })
          .eq("id", editingId)
          .eq("mosque_id", mosqueId);
        if (error) { alert("Gagal update: " + error.message); return; }
        await logAuditAction({
          action: "Update Finance",
          module: "Finance",
          metadata: { transaction_id: editingId, type, category, title, amount },
        });
        alert("Transaksi berhasil diupdate");
        clearForm();
        loadTransactions(mosqueId);
      } else {
        await supabase.from("transactions").insert([{
          type, category, title, amount, note: note || null, mosque_id: mosqueId,
        }]);
        await logAuditAction({
          action: "Create Finance",
          module: "Finance",
          metadata: { type, category, title, amount },
        });
        alert("Transaksi berhasil ditambah");
        clearForm();
        loadTransactions(mosqueId!);
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
      await supabase
        .from("transactions")
        .delete()
        .eq("id", deleteTarget.id)
        .eq("mosque_id", mosqueId);
      await logAuditAction({
        action: "Delete Finance",
        module: "Finance",
        metadata: { transaction_id: deleteTarget.id, title: deleteTarget.title, amount: deleteTarget.amount },
      });
      setDeleteTarget(null);
      loadTransactions(mosqueId);
    } finally {
      setDeleting(false);
    }
  };

  // ─── Aggregates (unchanged calculations) ──────────────────────────────────
  const totalIncome  = transactions.filter(t => t.type === "income") .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance      = totalIncome - totalExpense;

  const chartData = [
    { name: "Pemasukan",   total: totalIncome  },
    { name: "Pengeluaran", total: totalExpense },
    { name: "Saldo",       total: balance      },
  ];

  // ─── Custom Recharts tooltip ───────────────────────────────────────────────
  const RupiahTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm">
        <p className="text-slate-300 font-semibold mb-1">{label}</p>
        <p className="text-emerald-400 font-bold">{formatRupiah(payload[0].value)}</p>
      </div>
    );
  };

  // ─── Filtered + sorted view ────────────────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = transactions.filter((t) => {
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.note || "").toLowerCase().includes(q)
      );
    });
    switch (sortKey) {
      case "newest":      result = [...result].sort((a, b) => b.created_at.localeCompare(a.created_at)); break;
      case "oldest":      result = [...result].sort((a, b) => a.created_at.localeCompare(b.created_at)); break;
      case "amount_desc": result = [...result].sort((a, b) => b.amount - a.amount); break;
      case "amount_asc":  result = [...result].sort((a, b) => a.amount - b.amount); break;
    }
    return result;
  }, [transactions, search, sortKey]);


  // ─── Professional PDF export (unchanged) ──────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const printDate = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, pageW, 40, "F");
    doc.setFillColor(255, 255, 255);
    doc.circle(20, 20, 10, "F");
    doc.setFontSize(9); doc.setTextColor(16, 185, 129); doc.setFont("helvetica", "bold");
    doc.text("SM", 16.5, 21.5);
    doc.setFontSize(18); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold");
    doc.text("SmartMasjid", 35, 16);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(mosqueName || "Masjid", 35, 24);
    doc.setFontSize(9); doc.setTextColor(220, 252, 231);
    const dateLabel = `Dicetak: ${printDate}`;
    doc.text(dateLabel, pageW - doc.getTextWidth(dateLabel) - 8, 24);

    doc.setFontSize(16); doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold");
    doc.text("LAPORAN KEUANGAN MASJID", pageW / 2, 54, { align: "center" });

    const cardY = 62; const cardH = 18; const cardGap = 4;
    const cardW = (pageW - 28 - cardGap * 2) / 3;
    const cards = [
      { label: "Total Pemasukan",  value: totalIncome,  color: [16, 185, 129] as [number, number, number] },
      { label: "Total Pengeluaran", value: totalExpense, color: [239, 68, 68]  as [number, number, number] },
      { label: "Saldo",            value: balance,      color: [234, 179, 8]  as [number, number, number] },
    ];
    cards.forEach((card, i) => {
      const x = 14 + i * (cardW + cardGap);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(x, cardY, cardW, cardH, 3, 3, "F");
      doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.setFont("helvetica", "normal");
      doc.text(card.label, x + cardW / 2, cardY + 5.5, { align: "center" });
      doc.setFontSize(11); doc.setTextColor(...card.color); doc.setFont("helvetica", "bold");
      doc.text(formatRupiah(card.value), x + cardW / 2, cardY + 13, { align: "center" });
    });

    autoTable(doc, {
      startY: cardY + cardH + 8,
      head: [["No.", "Tanggal", "Jenis", "Kategori", "Judul", "Nominal"]],
      body: transactions.map((item, idx) => [
        idx + 1,
        formatIndonesianDateWithDay(item.created_at),
        item.type === "income" ? "Pemasukan" : "Pengeluaran",
        item.category, item.title, formatRupiah(item.amount),
      ]),
      headStyles: { fillColor: [15, 23, 42], textColor: [52, 211, 153], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 10, halign: "center" }, 2: { cellWidth: 24, halign: "center" }, 5: { halign: "right", fontStyle: "bold" } },
      margin: { left: 14, right: 14 },
      didDrawPage: () => {
        const pg = (doc.internal as any).getCurrentPageInfo().pageNumber;
        const total = (doc.internal as any).getNumberOfPages();
        doc.setFontSize(8); doc.setTextColor(148, 163, 184);
        doc.text(`Halaman ${pg} / ${total}  •  SmartMasjid`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? 200;
    doc.setFillColor(15, 23, 42);
    doc.rect(14, finalY + 2, pageW - 28, 14, "F");
    doc.setFontSize(10); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "normal");
    doc.text("Saldo Akhir:", 18, finalY + 11);
    doc.setFont("helvetica", "bold"); doc.setTextColor(52, 211, 153);
    doc.text(formatRupiah(balance), pageW - 16, finalY + 11, { align: "right" });
    doc.save(`laporan-keuangan-${new Date().toISOString().slice(0, 10)}.pdf`);
  };


  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-950 text-white flex">
      <Adminsidebar />

      {deleteTarget && (
        <DeleteModal
          transaction={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !deleting && setDeleteTarget(null)}
        />
      )}

      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">

          <h1 className="text-5xl font-bold text-emerald-400">Finance Dashboard</h1>

          {/* STATS — unchanged */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900 rounded-3xl p-6">
              <h2 className="text-2xl text-slate-400">Total Pemasukan</h2>
              <p className="text-4xl font-bold text-emerald-400 mt-4 break-all">{formatRupiah(totalIncome)}</p>
            </div>
            <div className="bg-slate-900 rounded-3xl p-6">
              <h2 className="text-2xl text-slate-400">Total Pengeluaran</h2>
              <p className="text-4xl font-bold text-red-400 mt-4 break-all">{formatRupiah(totalExpense)}</p>
            </div>
            <div className="bg-slate-900 rounded-3xl p-6">
              <h2 className="text-2xl text-slate-400">Saldo</h2>
              <p className="text-4xl font-bold text-yellow-400 mt-4 break-all">{formatRupiah(balance)}</p>
            </div>
          </div>

          {/* CHART — unchanged, auto-refreshes because chartData derives from transactions state */}
          <div className="bg-slate-900 rounded-3xl p-6">
            <h2 className="text-3xl font-bold text-emerald-400 mb-6">Grafik Keuangan</h2>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 13 }} />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickFormatter={(v) => `Rp ${new Intl.NumberFormat("id-ID").format(v)}`}
                    width={90}
                  />
                  <Tooltip content={<RupiahTooltip />} />
                  <Bar dataKey="total" fill="#34d399" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* EXPORT — unchanged */}
          <button
            onClick={exportPDF}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl font-bold w-fit flex items-center gap-2"
          >
            📄 Export PDF Laporan
          </button>

          {/* FORM — extended with edit support */}
          <div id="finance-form" className="bg-slate-900 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-3xl font-bold text-emerald-400">
                {editingId ? "Edit Transaksi" : "Tambah Transaksi"}
              </h2>
              {editingId && (
                <button onClick={clearForm} className="text-sm text-slate-400 hover:text-white underline">
                  Batal
                </button>
              )}
            </div>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-slate-800 p-4 rounded-2xl"
            >
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
            </select>

            <input
              type="text"
              placeholder="Kategori"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-800 p-4 rounded-2xl"
            />

            <input
              type="text"
              placeholder="Judul"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-800 p-4 rounded-2xl"
            />

            <input
              type="text"
              inputMode="numeric"
              placeholder="Rp 0"
              value={amountDisplay}
              onChange={handleAmountChange}
              className="bg-slate-800 p-4 rounded-2xl w-full"
            />

            <textarea
              placeholder="Catatan"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-slate-800 p-4 rounded-2xl min-h-[120px]"
            />

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-black font-bold p-4 rounded-2xl"
            >
              {saving ? "Menyimpan..." : editingId ? "Update Transaksi" : "Simpan Transaksi"}
            </button>
          </div>


          {/* TRANSACTION TABLE */}
          <div className="bg-slate-900 rounded-3xl p-6">
            {/* Header + search + sort */}
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <h2 className="text-3xl font-bold text-emerald-400">Riwayat Transaksi</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <input
                type="text"
                placeholder="Cari judul, kategori, atau catatan..."
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
            {transactions.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-2 text-center">
                <p className="text-xl font-semibold text-slate-300">Belum ada transaksi</p>
                <p className="text-slate-500 text-sm">Tidak ada transaksi untuk masjid ini.</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-center">
                <p className="text-slate-400">Tidak ada hasil untuk pencarian &ldquo;{search}&rdquo;</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-3 px-3 text-left font-semibold w-10">No.</th>
                      <th className="py-3 px-3 text-left font-semibold hidden lg:table-cell">Tanggal</th>
                      <th className="py-3 px-3 text-left font-semibold">Jenis</th>
                      <th className="py-3 px-3 text-left font-semibold hidden md:table-cell">Kategori</th>
                      <th className="py-3 px-3 text-left font-semibold">Judul</th>
                      <th className="py-3 px-3 text-right font-semibold">Nominal</th>
                      <th className="py-3 px-3 text-left font-semibold hidden xl:table-cell">Catatan</th>
                      <th className="py-3 px-3 text-center font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((item, idx) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-3 text-slate-400 hidden lg:table-cell whitespace-nowrap">
                          {formatIndonesianDateWithDay(item.created_at)}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${item.type === "income" ? "bg-emerald-900/50 text-emerald-400" : "bg-red-900/50 text-red-400"}`}>
                            {item.type === "income" ? "Pemasukan" : "Pengeluaran"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 hidden md:table-cell">{item.category}</td>
                        <td className="py-3 px-3 font-medium">{item.title}</td>
                        <td className={`py-3 px-3 text-right font-bold ${item.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                          {item.type === "income" ? "+" : "−"}{formatRupiah(item.amount)}
                        </td>
                        <td className="py-3 px-3 text-slate-400 hidden xl:table-cell max-w-[160px] truncate">
                          {item.note || <span className="text-slate-600">—</span>}
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
