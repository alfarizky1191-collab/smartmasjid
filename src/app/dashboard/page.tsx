
"use client"

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AdminSidebar from "@/components/Adminsidebar";
import { isKnownRole, canAccess, defaultRoute } from "@/lib/rbac";
import { extractStoragePath } from "@/lib/storage-utils";
import { logAuditAction } from "@/lib/audit";
import { ALL_THEMES, type TVThemeConfig } from "@/lib/themes";

export default function DashboardPage() {

  const [email, setEmail] = useState("");
  const [mosqueId, setMosqueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
  const [eventCount, setEventCount] = useState(0);
  const [officerCount, setOfficerCount] = useState(0);
  const [tvTheme, setTvTheme] = useState<string>("classic");
  const [savingTheme, setSavingTheme] = useState(false);

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
        .select("mosque_id, role")
        .eq("id", user.id)
        .single();

      if (!profileData?.mosque_id) return;

      const userRole = isKnownRole(profileData.role) ? profileData.role : "super_admin";
      if (!canAccess(userRole, "/dashboard")) {
        window.location.href = defaultRoute(userRole);
        return;
      }

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

        setTvTheme(mosque.tv_theme || "classic");
      }

      const {
        data: slidesData,
      } = await supabase

        .from("slides")

        .select("*")

        .eq("mosque_id", userMosqueId)

        .order("created_at", {
          ascending: false,
        });

      if (slidesData) {

        setSlides(slidesData);
      }

      loadAnnouncements(userMosqueId);

      // Summary counts — scoped to this mosque
      const { count: evCount } = await supabase
        .from("events").select("*", { count: "exact", head: true }).eq("mosque_id", userMosqueId);
      if (evCount !== null) setEventCount(evCount);

      const { count: offCount } = await supabase
        .from("officers").select("*", { count: "exact", head: true }).eq("mosque_id", userMosqueId);
      if (offCount !== null) setOfficerCount(offCount);
    };

    getData().finally(() => setLoading(false));

  }, []);

  const loadAnnouncements = async (mid?: string) => {

    const targetId = mid ?? mosqueId;
    if (!targetId) return;

    const {
      data,
    } = await supabase

      .from("announcements")

      .select("*")

      .eq("mosque_id", targetId)

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

        .eq("id", editingId)

        .eq("mosque_id", mosqueId);

      await logAuditAction({
        action: "Update Announcement",
        module: "Announcements",
        metadata: { announcement_id: editingId, title: announcement },
      });

      alert("Pengumuman berhasil diupdate");

    } else {

      await supabase

        .from("announcements")

        .insert({
          title: announcement,
          mosque_id: mosqueId,
        });

      await logAuditAction({
        action: "Create Announcement",
        module: "Announcements",
        metadata: { title: announcement },
      });

      // Kirim push notification ke subscriber masjid
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (token && mosqueId) {
          await fetch("/api/push/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
              mosque_id: mosqueId,
              title: "📢 Pengumuman Baru",
              body: announcement,
              url: "/app/info",
            }),
          });
        }
      } catch {
        // Push gagal tidak boleh block simpan pengumuman
      }

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

      .eq("id", id)

      .eq("mosque_id", mosqueId);

    await logAuditAction({
      action: "Delete Announcement",
      module: "Announcements",
      metadata: { announcement_id: id },
    });

    loadAnnouncements();
  };

  const handleUploadLogo = async () => {

    if (!logoFile) {

      alert("Pilih logo dulu");

      return;
    }

    const fileName = `${mosqueId}/${Date.now()}-${logoFile.name}`;

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

    const oldPath = extractStoragePath(logoUrl, "mosque-assets", mosqueId!);
    if (oldPath) {
      await supabase.storage.from("mosque-assets").remove([oldPath]);
    }

    await supabase

      .from("mosques")

      .update({
        logo_url: publicUrl,
      })

      .eq("id", mosqueId);

    await logAuditAction({
      action: "Logo Upload",
      module: "Media",
      metadata: { file_name: logoFile.name },
    });

    setLogoUrl(publicUrl);

    alert("Logo berhasil diupload");
  };

  const handleSaveSettings = async () => {

    if (!mosqueId) {
      alert("Data masjid belum dimuat. Coba refresh halaman.");
      return;
    }

    const { error } = await supabase

      .from("mosques")

      .update({
        running_text: runningText,
        running_text_speed: runningTextSpeed,
        iqomah_duration: iqomahDuration,
      })

      .eq("id", mosqueId);

    if (error) {
      console.error("Save settings error:", error);
      alert(`Gagal menyimpan: ${error.message}`);
      return;
    }

    await logAuditAction({
      action: "Settings Update",
      module: "Settings",
      metadata: {
        running_text_speed: runningTextSpeed,
        iqomah_duration: iqomahDuration,
      },
    });

    alert("Setting berhasil disimpan");
  };

  const handleSaveTheme = async () => {
    if (!mosqueId) return;
    setSavingTheme(true);
    const { error } = await supabase
      .from("mosques")
      .update({ tv_theme: tvTheme })
      .eq("id", mosqueId);
    setSavingTheme(false);
    if (error) {
      alert(`Gagal menyimpan tema: ${error.message}`);
      return;
    }
    await logAuditAction({
      action: "Settings Update",
      module: "Settings",
      metadata: { tv_theme: tvTheme },
    });
    alert("Tema TV berhasil disimpan");
  };

  const handleUploadSlide = async (e: any) => {

    const file = e.target.files?.[0];

    if (!file) return;

    const fileName = `${mosqueId}/${Date.now()}-${file.name}`;

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

      .eq("mosque_id", mosqueId)

      .order("created_at", {
        ascending: false,
      });

    await logAuditAction({
      action: "Slide Upload",
      module: "Media",
      metadata: { file_name: file.name },
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

    const slide = slides.find((s) => s.id === id);
    if (slide?.image_url && mosqueId) {
      const path = extractStoragePath(slide.image_url, "slides", mosqueId);
      if (path) await supabase.storage.from("slides").remove([path]);
    }

    await supabase

      .from("slides")

      .delete()

      .eq("id", id)

      .eq("mosque_id", mosqueId);

    await logAuditAction({
      action: "Slide Delete",
      module: "Media",
      metadata: { slide_id: id },
    });

    setSlides(
      slides.filter(
        (item) => item.id !== id
      )
    );
  };

  const handleLogout = async () => {

    await logAuditAction({ action: "Logout", module: "Auth" });

    await supabase.auth.signOut();

    window.location.href = "/login";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex">
        <AdminSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="h-28 bg-slate-900 rounded-3xl animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-900 rounded-xl animate-pulse" />)}
            </div>
            <div className="h-48 bg-slate-900 rounded-3xl animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

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

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-sm text-slate-400">Pengumuman</p>
            <p className="text-2xl font-bold text-emerald-400">{announcements.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-sm text-slate-400">Slides</p>
            <p className="text-2xl font-bold text-emerald-400">{slides.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-sm text-slate-400">Total Event</p>
            <p className="text-2xl font-bold text-emerald-400">{eventCount}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-sm text-slate-400">Total Petugas</p>
            <p className="text-2xl font-bold text-emerald-400">{officerCount}</p>
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
          <p className='text-xs text-slate-400 mt-1'>Durasi hitung mundur iqomah setelah adzan selesai, dalam detik (contoh: 300 = 5 menit).</p>

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
          <p className='text-xs text-slate-400 mt-1'>Kecepatan teks berjalan. Semakin kecil angka, semakin cepat (rekomendasi: 20–40 detik).</p>

          <button
            onClick={handleSaveSettings}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold p-4 rounded-2xl"
          >
            Simpan Setting
          </button>

        </div>

        {/* TEMA TV DISPLAY */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-5">

          <div>
            <h2 className="text-3xl font-bold text-emerald-400">
              Tema TV Display
            </h2>
            <p className="text-slate-400 mt-1 text-sm">
              Pilih tampilan visual untuk layar TV masjid Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALL_THEMES.map((theme: TVThemeConfig) => {
              const isSelected = tvTheme === theme.id;
              const isPro = theme.tier === "pro";
              return (
                <button
                  key={theme.id}
                  onClick={() => setTvTheme(theme.id)}
                  className={`relative text-left rounded-xl border-2 transition-all overflow-hidden ${
                    isSelected
                      ? "border-emerald-400 ring-2 ring-emerald-400/40"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  {/* Color preview strip */}
                  <div
                    className="h-16 w-full"
                    style={{ background: theme.colors.background }}
                  >
                    <div className="flex h-full items-end pb-2 px-3 gap-1.5">
                      {[
                        theme.colors.primary,
                        theme.colors.secondary,
                        theme.colors.prayerHighlight,
                        theme.colors.timeAccent,
                        theme.colors.surface,
                      ].map((color, i) => (
                        <span
                          key={i}
                          className="w-5 h-5 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Theme info */}
                  <div className="bg-slate-800 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white leading-tight">{theme.name}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                          isPro
                            ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {isPro ? "Pro" : "Free"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{theme.description}</p>
                  </div>

                  {/* Selected checkmark */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center">
                      <span className="text-black text-xs font-bold">✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveTheme}
              disabled={savingTheme}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-bold px-6 py-3 rounded-2xl"
            >
              {savingTheme ? "Menyimpan..." : "Simpan Tema"}
            </button>
            <span className="text-sm text-slate-400">
              Tema aktif: <span className="text-emerald-300 font-medium">
                {ALL_THEMES.find((t: TVThemeConfig) => t.id === tvTheme)?.name ?? tvTheme}
              </span>
            </span>
          </div>

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

            {slides.length === 0 && (
              <p className="text-slate-400 col-span-3">Belum ada slide.</p>
            )}

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

          {announcements.length === 0 && (
            <p className="text-slate-400">Belum ada pengumuman.</p>
          )}

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
