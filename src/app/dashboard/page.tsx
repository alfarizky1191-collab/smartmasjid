
"use client"

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AdminSidebar from "@/components/Adminsidebar";

export default function DashboardPage() {

  const [email, setEmail] = useState("");
  const [mosqueId, setMosqueId] = useState<string | null>(null);

  const [mosqueName, setMosqueName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");

  const [runningText, setRunningText] = useState("");
  const [runningTextSpeed, setRunningTextSpeed] = useState(20);
  const [iqomahDuration, setIqomahDuration] = useState(300);

  const [announcement, setAnnouncement] = useState("");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [slides, setSlides] = useState<any[]>([]);

  useEffect(() => {

    const getData = async () => {

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {

        window.location.href = "/login";

        return;
      }

      setEmail(user.email || "");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("mosque_id")
        .eq("id", user.id)
        .single();

      if (!profileData?.mosque_id) return;

      const userMosqueId = profileData.mosque_id;
      setMosqueId(userMosqueId);

      const {
        data: mosqueData,
      } = await supabase

        .from("mosques")

        .select("*")

        .eq("id", userMosqueId)

        .single();

      if (mosqueData) {

        const mosque = mosqueData;

        setMosqueName(mosque.name || "");

        setLogoUrl(mosque.logo_url || "");

        setRunningText(mosque.running_text || "");

        setIqomahDuration(mosque.iqomah_duration || 300);

        setRunningTextSpeed(
          mosque.running_text_speed || 20
        );
      }

      const {
        data: slidesData,
      } = await supabase

        .from("slides")

        .select("*")

        .order("created_at", {
          ascending: false,
        });

      if (slidesData) {

        setSlides(slidesData);
      }

      loadAnnouncements();
    };

    getData();

  }, []);

  const loadAnnouncements = async () => {

    const {
      data,
    } = await supabase

      .from("announcements")

      .select("*")

      .order("created_at", {
        ascending: false,
      });

    if (data) {

      setAnnouncements(data);
    }
  };

  const handleSaveAnnouncement = async () => {

    if (!announcement.trim()) {

      alert("Isi pengumuman dulu");

      return;
    }

    if (editingId) {

      await supabase

        .from("announcements")

        .update({
          title: announcement,
        })

        .eq("id", editingId);

      alert("Pengumuman berhasil diupdate");

    } else {

      await supabase

        .from("announcements")

        .insert({
          title: announcement,
          mosque_id: mosqueId,
        });

      alert("Pengumuman berhasil ditambah");
    }

    setAnnouncement("");

    setEditingId(null);

    loadAnnouncements();
  };

  const handleEdit = (item: any) => {

    setAnnouncement(item.title);

    setEditingId(item.id);
  };

  const handleDelete = async (id: number) => {

    const confirmDelete = confirm(
      "Hapus pengumuman?"
    );

    if (!confirmDelete) return;

    await supabase

      .from("announcements")

      .delete()

      .eq("id", id);

    loadAnnouncements();
  };

  const handleUploadLogo = async () => {

    if (!logoFile) {

      alert("Pilih logo dulu");

      return;
    }

    const fileName = `${Date.now()}-${logoFile.name}`;

    const {
      error: uploadError,
    } = await supabase.storage

      .from("mosque-assets")

      .upload(fileName, logoFile);

    if (uploadError) {

      alert(uploadError.message);

      return;
    }

    const {
      data,
    } = supabase.storage

      .from("mosque-assets")

      .getPublicUrl(fileName);

    const publicUrl = data.publicUrl;

    await supabase

      .from("mosques")

      .update({
        logo_url: publicUrl,
      })

      .eq("id", mosqueId);

    setLogoUrl(publicUrl);

    alert("Logo berhasil diupload");
  };

  const handleSaveSettings = async () => {

    await supabase

      .from("mosques")

      .update({
        running_text: runningText,
        running_text_speed: runningTextSpeed,
        iqomah_duration: iqomahDuration,
      })

      .eq("id", mosqueId);

    alert("Setting berhasil disimpan");
  };

  const handleUploadSlide = async (e: any) => {

    const file = e.target.files?.[0];

    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;

    const {
      error: uploadError,
    } = await supabase.storage

      .from("slides")

      .upload(fileName, file);

    if (uploadError) {

      alert(uploadError.message);

      return;
    }

    const {
      data,
    } = supabase.storage

      .from("slides")

      .getPublicUrl(fileName);

    await supabase

      .from("slides")

      .insert([
        {
          image_url: data.publicUrl,
          mosque_id: mosqueId,
        },
      ]);

    const {
      data: slidesData,
    } = await supabase

      .from("slides")

      .select("*")

      .order("created_at", {
        ascending: false,
      });

    if (slidesData) {

      setSlides(slidesData);
    }

    alert("Slide berhasil upload");
  };

  const handleDeleteSlide = async (id: number) => {

    const confirmDelete = confirm(
      "Hapus slide?"
    );

    if (!confirmDelete) return;

    await supabase

      .from("slides")

      .delete()

      .eq("id", id);

    setSlides(
      slides.filter(
        (item) => item.id !== id
      )
    );
  };

  const handleLogout = async () => {

    await supabase.auth.signOut();

    window.location.href = "/login";
  };

  return (

  <main className="min-h-screen bg-slate-950 text-white flex">

    <AdminSidebar />

    <div className="flex-1 p-6">

      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex items-center gap-6">

          {logoUrl && (

            <img
              src={logoUrl}
              alt="Logo"
              className="w-28 h-28 rounded-full object-cover border-4 border-emerald-400"
            />

          )}

          <div>

            <h1 className="text-4xl font-bold text-emerald-400">
              Dashboard Masjid
            </h1>

            <p className="text-slate-400 mt-2">
              {email}
            </p>

            <p className="text-xl mt-2">
              {mosqueName}
            </p>

          </div>

        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">

          <h2 className="text-3xl font-bold text-emerald-400">
            Upload Logo
          </h2>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setLogoFile(
                e.target.files?.[0] || null
              )
            }
            className="bg-slate-800 p-4 rounded-2xl"
          />

          <button
            onClick={handleUploadLogo}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold p-4 rounded-2xl"
          >
            Upload Logo
          </button>

        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">

          <h2 className="text-3xl font-bold text-emerald-400">
            Setting TV
          </h2>

          <textarea
            placeholder="Running text..."
            value={runningText}
            onChange={(e) =>
              setRunningText(
                e.target.value
              )
            }
            className="bg-slate-800 p-4 rounded-2xl min-h-[120px]"
          />

          <input
            type="number"
            placeholder="Iqomah (detik)"
            value={iqomahDuration}
            onChange={(e) =>
              setIqomahDuration(
                Number(e.target.value)
              )
            }
            className="bg-slate-800 p-4 rounded-2xl"
          />

          <input
            type="number"
            placeholder="Speed Running Text"
            value={runningTextSpeed}
            onChange={(e) =>
              setRunningTextSpeed(
                Number(e.target.value)
              )
            }
            className="bg-slate-800 p-4 rounded-2xl"
          />

          <button
            onClick={handleSaveSettings}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold p-4 rounded-2xl"
          >
            Simpan Setting
          </button>

        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">

          <h2 className="text-3xl font-bold text-emerald-400">
            Upload Slide
          </h2>

          <input
            type="file"
            accept="image/*"
            onChange={handleUploadSlide}
            className="bg-slate-800 p-4 rounded-2xl"
          />

          <div className="grid grid-cols-3 gap-4 mt-4">

            {slides.map((slide) => (

              <div
                key={slide.id}
                className="relative"
              >

                <img
                  src={slide.image_url}
                  alt="Slide"
                  className="rounded-2xl h-48 w-full object-cover"
                />

                <button
                  onClick={() =>
                    handleDeleteSlide(
                      slide.id
                    )
                  }
                  className="absolute top-2 right-2 bg-red-500 text-white px-4 py-2 rounded-xl font-bold"
                >
                  Delete
                </button>

              </div>
            ))}

          </div>

        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">

          <h2 className="text-3xl font-bold text-emerald-400">
            {editingId
              ? "Edit Pengumuman"
              : "Tambah Pengumuman"}
          </h2>

          <input
            type="text"
            placeholder="Masukkan pengumuman..."
            value={announcement}
            onChange={(e) =>
              setAnnouncement(
                e.target.value
              )
            }
            className="bg-slate-800 p-4 rounded-2xl"
          />

          <button
            onClick={handleSaveAnnouncement}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold p-4 rounded-2xl"
          >
            {editingId
              ? "Update Pengumuman"
              : "Simpan Pengumuman"}
          </button>

        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4">

          <h2 className="text-3xl font-bold text-emerald-400">
            List Pengumuman
          </h2>

          {announcements.map((item) => (

            <div
              key={item.id}
              className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4"
            >

              <p className="text-xl">
                {item.title}
              </p>

              <div className="flex gap-3">

                <button
                  onClick={() =>
                    handleEdit(item)
                  }
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-4 py-2 rounded-xl"
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    handleDelete(item.id)
                  }
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-xl"
                >
                  Delete
                </button>

              </div>

            </div>
          ))}

        </div>

       

            </div>

    </div>

  </main>
);
}
