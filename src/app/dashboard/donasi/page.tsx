"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase/client";
import Adminsidebar from "@/components/Adminsidebar";
import { isKnownRole, canAccess, defaultRoute } from "@/lib/rbac";
import { extractStoragePath } from "@/lib/storage-utils";
import { logAuditAction } from "@/lib/audit";

export default function DonasiPage() {

  const [mosqueId, setMosqueId] = useState<string | null>(null);

  const [
    qrisFile,
    setQrisFile,
  ] = useState<File | null>(
    null
  );

  const [
    qrisUrl,
    setQrisUrl,
  ] = useState("");

  const [
    donorName,
    setDonorName,
  ] = useState("");

  const [
    amount,
    setAmount,
  ] = useState(0);

  const [
    note,
    setNote,
  ] = useState("");

  const [
    donations,
    setDonations,
  ] = useState<any[]>([]);

  const loadDonations =
    async (mid: string) => {

      const {
        data,
      } = await supabase

        .from(
          "donations"
        )

        .select("*")

        .eq("mosque_id", mid)

        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );

      if (data) {

        setDonations(
          data
        );
      }
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
        if (!canAccess(userRole, "/dashboard/donasi")) {
          window.location.href = defaultRoute(userRole);
          return;
        }
        setMosqueId(data.mosque_id);
        await loadDonations(data.mosque_id);

        // Load existing QRIS URL so we can clean it up on replacement
        const { data: qrisData } = await supabase
          .from("qris_settings")
          .select("image_url")
          .eq("mosque_id", data.mosque_id)
          .single();
        if (qrisData?.image_url) setQrisUrl(qrisData.image_url);

          const donationChannel =
            supabase
              .channel("donation-realtime")
              .on(
                "postgres_changes",
                {
                  event: "*",
                  schema: "public",
                  table: "donations",
                  filter: `mosque_id=eq.${data.mosque_id}`,
                },
                () => { loadDonations(data.mosque_id); }
              )
              .subscribe();

          return () => { supabase.removeChannel(donationChannel); };
        }
    };
    init();

  }, []);

  const uploadQris =
    async () => {

      if (!qrisFile)
        return;

      const fileName =
        `${mosqueId}/${Date.now()}-${qrisFile.name}`;

      await supabase

        .storage

        .from("qris")

        .upload(
          fileName,
          qrisFile
        );

      const publicUrl =

        supabase.storage

          .from("qris")

          .getPublicUrl(
            fileName
          )

          .data.publicUrl;

      setQrisUrl(
        publicUrl
      );

      const oldPath = extractStoragePath(qrisUrl, "qris", mosqueId!);
      if (oldPath) await supabase.storage.from("qris").remove([oldPath]);

      await supabase

  .from(
    "qris_settings"
  )

  .upsert([
    {
      mosque_id: mosqueId,

      image_url:
        publicUrl,
    },
  ], { onConflict: "mosque_id" });

      await logAuditAction({
        action: "QRIS Update",
        module: "QRIS",
        metadata: { file_name: qrisFile.name },
      });

      alert(
        "QRIS berhasil upload"
      );
    };

  const addDonation =
    async () => {

      if (!mosqueId) return;

      await supabase

        .from(
          "donations"
        )

        .insert([
          {
            donor_name:
              donorName,

            amount,

            note,

            mosque_id: mosqueId,
          },
        ]);

      await supabase

        .from(
          "transactions"
        )

        .insert([
          {
            type:
              "income",

            category:
              "Donasi QRIS",

            title:
              donorName ||
              "Hamba Allah",

            amount,

            note,

            mosque_id: mosqueId,
          },
        ]);

      setDonorName("");
      setAmount(0);
      setNote("");

      await logAuditAction({
        action: "Create Donation",
        module: "Donasi",
        metadata: { donor_name: donorName || "Hamba Allah", amount },
      });

      loadDonations(mosqueId);

      alert(
        "Donasi berhasil ditambah"
      );
    };

  const totalDonations =
    donations.reduce(

      (
        total,
        item
      ) =>

        total +
        item.amount,

      0
    );

  return (

    <main className="min-h-screen bg-slate-950 text-white flex">

      <Adminsidebar />

      <div className="flex-1 p-6">

        <div className="max-w-7xl mx-auto flex flex-col gap-6">

        <h1 className="text-5xl font-bold text-emerald-400">

          QRIS Donasi

        </h1>

        {/* TOTAL */}

        <div className="bg-slate-900 rounded-3xl p-6">

          <h2 className="text-2xl text-slate-400">

            Total Donasi

          </h2>

          <p className="text-5xl font-bold text-emerald-400 mt-4">

            Rp {totalDonations.toLocaleString("id-ID")}

          </p>

        </div>

        {/* QRIS */}

        <div className="bg-slate-900 rounded-3xl p-6 flex flex-col gap-4">

          <h2 className="text-3xl font-bold text-emerald-400">

            Upload QRIS

          </h2>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>

              setQrisFile(
                e.target
                  .files?.[0] ||
                  null
              )

            }
            className="bg-slate-800 p-4 rounded-2xl"
          />

          <button
            onClick={
              uploadQris
            }
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold p-4 rounded-2xl"
          >

            Upload QRIS

          </button>

          {qrisUrl && (

            <img
              src={qrisUrl}
              alt="QRIS"
              className="w-96 rounded-3xl border-4 border-emerald-400"
            />

          )}

        </div>

        {/* TAMBAH DONASI */}

        <div className="bg-slate-900 rounded-3xl p-6 flex flex-col gap-4">

          <h2 className="text-3xl font-bold text-emerald-400">

            Tambah Donasi

          </h2>

          <input
            type="text"
            placeholder="Nama Donatur"
            value={donorName}
            onChange={(e) =>

              setDonorName(
                e.target.value
              )

            }
            className="bg-slate-800 p-4 rounded-2xl"
          />

          <input
            type="number"
            placeholder="Jumlah Donasi"
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
              addDonation
            }
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold p-4 rounded-2xl"
          >

            Simpan Donasi

          </button>

        </div>

        {/* LIST */}

        <div className="bg-slate-900 rounded-3xl p-6">

          <h2 className="text-3xl font-bold text-emerald-400 mb-6">

            Riwayat Donasi

          </h2>

          <div className="flex flex-col gap-4">

            {donations.length === 0 && (
              <p className="text-slate-400">Belum ada data donasi.</p>
            )}

            {donations.map(
              (item) => (

                <div
                  key={item.id}
                  className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between"
                >

                  <div>

                    <h3 className="text-2xl font-bold">

                      {item.donor_name ||
                        "Hamba Allah"}

                    </h3>

                    <p className="text-slate-400 mt-2">

                      {item.note}

                    </p>

                  </div>

                  <p className="text-3xl font-bold text-emerald-400">

                    Rp {item.amount.toLocaleString("id-ID")}

                  </p>

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
