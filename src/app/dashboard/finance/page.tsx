"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase/client";
import jsPDF from "jspdf";

import autoTable from "jspdf-autotable";

import {

  ResponsiveContainer,

  BarChart,

  Bar,

  XAxis,

  YAxis,

  Tooltip,

} from "recharts";

import Adminsidebar from "@/components/Adminsidebar";
import { formatIndonesianDateWithDay } from "@/lib/date-utils";

export default function FinancePage() {

  const [mosqueId, setMosqueId] = useState<string | null>(null);

  const [type, setType] =
    useState("income");

  const [category, setCategory] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [amount, setAmount] =
    useState(0);

  const [note, setNote] =
    useState("");

  const [
    transactions,
    setTransactions,
  ] = useState<any[]>([]);

  const loadTransactions =
    async () => {

      const {
        data,
      } = await supabase

        .from(
          "transactions"
        )

        .select("*")

        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );

      if (data) {

        setTransactions(
          data
        );
      }
    };

  useEffect(() => {

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("mosque_id")
          .eq("id", user.id)
          .single();
        if (data) setMosqueId(data.mosque_id);
      }
      await loadTransactions();
    };
    init();

  }, []);

  const handleSave =
    async () => {

      if (
        !title ||
        !category ||
        !amount
      ) {

        alert(
          "Lengkapi data"
        );

        return;
      }

      await supabase

        .from(
          "transactions"
        )

        .insert([
          {
            type,
            category,
            title,
            amount,
            note,
            mosque_id: mosqueId,
          },
        ]);

      setTitle("");
      setCategory("");
      setAmount(0);
      setNote("");

      loadTransactions();

      alert(
        "Transaksi berhasil ditambah"
      );
    };

  const totalIncome =
    transactions

      .filter(
        (item) =>
          item.type ===
          "income"
      )

      .reduce(
        (
          total,
          item
        ) =>
          total +
          item.amount,
        0
      );

  const totalExpense =
    transactions

      .filter(
        (item) =>
          item.type ===
          "expense"
      )

      .reduce(
        (
          total,
          item
        ) =>
          total +
          item.amount,
        0
      );

  const balance =
    totalIncome -
    totalExpense;
    const chartData = [

  {
    name: "Pemasukan",

    total:
      totalIncome,
  },

  {
    name: "Pengeluaran",

    total:
      totalExpense,
  },

  {
    name: "Saldo",

    total:
      balance,
  },
];
const exportPDF =
  () => {

    const doc =
      new jsPDF();

    doc.setFontSize(
      22
    );

    doc.text(
      "Laporan Keuangan Masjid",
      14,
      20
    );

    doc.setFontSize(
      14
    );

    doc.text(

      `Total Pemasukan: Rp ${totalIncome.toLocaleString("id-ID")}`,

      14,

      40
    );

    doc.text(

      `Total Pengeluaran: Rp ${totalExpense.toLocaleString("id-ID")}`,

      14,

      50
    );

    doc.text(

      `Saldo: Rp ${balance.toLocaleString("id-ID")}`,

      14,

      60
    );

    autoTable(
      doc,
      {

        startY: 80,

        head: [[

          "Tanggal",

          "Jenis",

          "Kategori",

          "Judul",

          "Jumlah",

        ]],

        body:
          transactions.map(
            (item) => [

              formatIndonesianDateWithDay(item.created_at),

              item.type ===
              "income"

                ? "Pemasukan"

                : "Pengeluaran",

              item.category,

              item.title,

              `Rp ${item.amount.toLocaleString("id-ID")}`,
            ]
          ),
      }
    );

    doc.save(
      "laporan-keuangan.pdf"
    );
  };

  return (

    <main className="min-h-screen bg-slate-950 text-white flex">

      <Adminsidebar />

      <div className="flex-1 p-6">

      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        <h1 className="text-5xl font-bold text-emerald-400">

          Finance Dashboard

        </h1>

        {/* STATS */}

        <div className="grid grid-cols-3 gap-4">

          <div className="bg-slate-900 rounded-3xl p-6">

            <h2 className="text-2xl text-slate-400">

              Total Pemasukan

            </h2>

            <p className="text-5xl font-bold text-emerald-400 mt-4">

              Rp {totalIncome.toLocaleString("id-ID")}

            </p>

          </div>

          <div className="bg-slate-900 rounded-3xl p-6">

            <h2 className="text-2xl text-slate-400">

              Total Pengeluaran

            </h2>

            <p className="text-5xl font-bold text-red-400 mt-4">

              Rp {totalExpense.toLocaleString("id-ID")}

            </p>

          </div>

          <div className="bg-slate-900 rounded-3xl p-6">

            <h2 className="text-2xl text-slate-400">

              Saldo

            </h2>

            <p className="text-5xl font-bold text-yellow-400 mt-4">

              Rp {balance.toLocaleString("id-ID")}

            </p>

          </div>

        </div>

        <div className="bg-slate-900 rounded-3xl p-6">

  <h2 className="text-3xl font-bold text-emerald-400 mb-6">

    Grafik Keuangan

  </h2>

  <div className="h-[400px]">

    <ResponsiveContainer
      width="100%"
      height="100%"
    >

      <BarChart
        data={chartData}
      >

        <XAxis
          dataKey="name"
        />

        <YAxis />

        <Tooltip />

        <Bar
          dataKey="total"
          radius={[
            20,
            20,
            0,
            0,
          ]}
        />

      </BarChart>

    </ResponsiveContainer>

  </div>

</div>
<button
  onClick={exportPDF}
  className="bg-blue-500 hover:bg-blue-600 px-6 py-4 rounded-2xl font-bold w-fit"
>

  Export PDF

</button>

        {/* FORM */}

        <div className="bg-slate-900 rounded-3xl p-6 flex flex-col gap-4">

          <h2 className="text-3xl font-bold text-emerald-400">

            Tambah Transaksi

          </h2>

          <select
            value={type}
            onChange={(e) =>
              setType(
                e.target.value
              )
            }
            className="bg-slate-800 p-4 rounded-2xl"
          >

            <option value="income">

              Pemasukan

            </option>

            <option value="expense">

              Pengeluaran

            </option>

          </select>

          <input
            type="text"
            placeholder="Kategori"
            value={category}
            onChange={(e) =>
              setCategory(
                e.target.value
              )
            }
            className="bg-slate-800 p-4 rounded-2xl"
          />

          <input
            type="text"
            placeholder="Judul"
            value={title}
            onChange={(e) =>
              setTitle(
                e.target.value
              )
            }
            className="bg-slate-800 p-4 rounded-2xl"
          />

          <input
            type="number"
            placeholder="Jumlah"
            value={amount}
            onChange={(e) =>
              setAmount(
                Number(
                  e.target.value
                )
              )
            }
            className="bg-slate-800 p-4 rounded-2xl"
          />

          <textarea
            placeholder="Catatan"
            value={note}
            onChange={(e) =>
              setNote(
                e.target.value
              )
            }
            className="bg-slate-800 p-4 rounded-2xl min-h-[120px]"
          />

          <button
            onClick={
              handleSave
            }
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold p-4 rounded-2xl"
          >

            Simpan Transaksi

          </button>

        </div>

        {/* TABLE */}

        <div className="bg-slate-900 rounded-3xl p-6">

          <h2 className="text-3xl font-bold text-emerald-400 mb-6">

            Riwayat Transaksi

          </h2>

          <div className="flex flex-col gap-4">

            {transactions.length === 0 && (
              <p className="text-slate-400">Belum ada transaksi.</p>
            )}

            {transactions.map(
              (item) => (

                <div
  key={item.id}
  className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between"
>

  <div>

    <h3 className="text-2xl font-bold">

      {item.title}

    </h3>

    <p className="text-slate-400 mt-2">

      {item.category}

    </p>

    {item.note && (

      <p className="text-slate-500 mt-2">

        {item.note}

      </p>

    )}

  </div>

  <div className="flex items-center gap-4">

    <div className="text-right">

      <p
        className={`text-3xl font-bold ${
          item.type ===
          "income"

            ? "text-emerald-400"

            : "text-red-400"
        }`}
      >

        {item.type ===
        "income"

          ? "+"

          : "-"}

        Rp {item.amount.toLocaleString("id-ID")}

      </p>

    </div>

    <button
      onClick={async () => {

        const confirmDelete =
          confirm(
            "Hapus transaksi?"
          );

        if (
          !confirmDelete
        ) return;

        await supabase

          .from(
            "transactions"
          )

          .delete()

          .eq(
            "id",
            item.id
          );

        loadTransactions();
      }}
      className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl font-bold"
    >

      Delete

    </button>

  </div>

</div>

              )
            )}

          </div>

        </div>

      </div>

      </div>

    </main>
  );
}
