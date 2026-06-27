"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AdminSidebar from "@/components/Adminsidebar";
import { isKnownRole, canAccess, defaultRoute } from "@/lib/rbac";
import { extractStoragePath } from "@/lib/storage-utils";
import {
  getProvinces,
  findProvinceByName,
  findCityByName,
  getCitiesForProvince,
  getDistrictsForCity,
  getPostalCodeForDistrict,
} from "@/lib/indonesia-locations";
import { setRuntimeProvinces } from "@/lib/indonesia-locations";
import { logAuditAction } from "@/lib/audit";

export default function SettingsPage() {
  const [mosqueId, setMosqueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [provinceId, setProvinceId] = useState<string | undefined>(undefined);
  const [cityId, setCityId] = useState<string | undefined>(undefined);
  const [districtId, setDistrictId] = useState<string | undefined>(undefined);
  const [districtName, setDistrictName] = useState("");
  const [adzanUrl, setAdzanUrl] = useState("");
  const [adzanSubuhUrl, setAdzanSubuhUrl] = useState("");
  const [alarmUrl, setAlarmUrl] = useState("");
  const [adzanFile, setAdzanFile] = useState<File | null>(null);
  const [adzanSubuhFile, setAdzanSubuhFile] = useState<File | null>(null);
  const [alarmFile, setAlarmFile] = useState<File | null>(null);
  const [districts, setDistricts] = useState<{ id: string; name: string; postal_codes?: string[] }[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [postalCode, setPostalCode] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState("");
  const [postalColumnAvailable, setPostalColumnAvailable] = useState(true);
  const [taglineColumnAvailable, setTaglineColumnAvailable] = useState(true);
  const [districtColumnAvailable, setDistrictColumnAvailable] = useState(true);

  const fetchDistricts = async (provId: string, cId: string) => {
    setLoadingDistricts(true);
    setDistricts([]);
    try {
      // BPS id "32.04" → emsifa id "3204" (remove all dots)
      const numericCityId = cId.replace(/\./g, "");
      const res = await fetch(`https://emsifa.github.io/api-wilayah-indonesia/api/districts/${numericCityId}.json`);
      if (res.ok) {
        const data: { id: string; name: string }[] = await res.json();
        const mapped = data.map((d) => ({ id: d.id, name: d.name }));
        setDistricts(mapped);
        return mapped;
      }
    } catch { /* ignore */ } finally {
      setLoadingDistricts(false);
    }
    // fallback to built-in lib
    const fallback = getDistrictsForCity(provId, cId);
    setDistricts(fallback);
    return fallback;
  };

  useEffect(() => {
    const init = async () => {
      // try to load a full dataset from public/indonesia-locations.json (optional)
      try {
        const res = await fetch('/indonesia-locations.json');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setRuntimeProvinces(data);
          }
        }
      } catch (err) {
        // ignore; fallback to built-in compact dataset
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("mosque_id, role")
        .eq("id", user.id)
        .single();

      if (!profile?.mosque_id) { setLoading(false); return; }

      const userRole = isKnownRole(profile.role) ? profile.role : "super_admin";
      if (!canAccess(userRole, "/dashboard/settings")) {
        window.location.href = defaultRoute(userRole);
        return;
      }
      setMosqueId(profile.mosque_id);

      // Fetch mosque profile. Some deployments may not have `postal_code`, `tagline`, or `district` columns.
      let mosque: any = null;
      let localPostalAvail = true;
      let localTaglineAvail = true;
      let localDistrictAvail = true;

      const tryFetch = async (withPostal: boolean, withTagline: boolean, withDistrict: boolean) => {
        const cols = ["name", "slug", "address", "city", "province", ...(withDistrict ? ["district"] : []), ...(withPostal ? ["postal_code"] : []), ...(withTagline ? ["tagline"] : []), "logo_url", "adzan_url", "adzan_subuh_url", "alarm_url"].join(", ");
        return supabase.from("mosques").select(cols).eq("id", profile.mosque_id).single();
      };

      const isColErr = (msg: string, col: string) =>
        msg.toLowerCase().includes(col) || msg.toLowerCase().includes(`column "${col}"`);

      let resp = await tryFetch(true, true, true);
      if ((resp as any).error) {
        const msg = ((resp as any).error?.message || "").toLowerCase();
        if (isColErr(msg, "tagline")) { localTaglineAvail = false; setTaglineColumnAvailable(false); }
        if (isColErr(msg, "postal_code")) { localPostalAvail = false; setPostalColumnAvailable(false); }
        if (isColErr(msg, "district")) { localDistrictAvail = false; setDistrictColumnAvailable(false); }
        if (!localPostalAvail || !localTaglineAvail || !localDistrictAvail) {
          resp = await tryFetch(localPostalAvail, localTaglineAvail, localDistrictAvail);
          if ((resp as any).error) {
            const e = (resp as any).error;
            console.warn("Mosque profile fetch failed after fallback:", e?.message || e?.code || JSON.stringify(e));
          }
        } else {
          const e = (resp as any).error;
          console.warn("Mosque profile fetch error:", e?.message || e?.code || e?.details || JSON.stringify(e));
        }
      }
      mosque = (resp as any).data;

      if (mosque) {
        setName(mosque.name || "");
        setSlug(mosque.slug || "");
        setAddress(mosque.address || "");
        // Try to map existing text values to known province/city IDs
        const provMatch = findProvinceByName(mosque.province || undefined);
        if (provMatch) {
          setProvinceId(provMatch.id);
          setProvince(provMatch.name);
          const cityMatch = findCityByName(provMatch.id, mosque.city || undefined);
          if (cityMatch) {
            setCity(cityMatch.name);
            setCityId(cityMatch.id);
            // fetch districts for the restored city
            try {
              const dists = await fetchDistricts(provMatch.id, cityMatch.id);
              // restore district selection from saved district name
              if (mosque.district) {
                const matched = dists.find((d: any) =>
                  d.name.toLowerCase() === mosque.district.toLowerCase()
                );
                if (matched) { setDistrictId(matched.id); setDistrictName(matched.name); }
                else setDistrictName(mosque.district);
              }
            } catch { /* non-fatal */ }
            // restore postal code
            setPostalCode(((mosque.postal_code as any) || "") as string);
          } else {
            setCity(mosque.city || "");
            setPostalCode(((mosque.postal_code as any) || "") as string);
          }
        } else {
          setProvince(mosque.province || "");
          setCity(mosque.city || "");
          setPostalCode(((mosque.postal_code as any) || "") as string);
        }

        setTagline(mosque.tagline || "");
        setLogoUrl(mosque.logo_url || "");
        setAdzanUrl(mosque.adzan_url || "");
        setAdzanSubuhUrl(mosque.adzan_subuh_url || "");
        setAlarmUrl(mosque.alarm_url || "");
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleUploadLogo = async () => {
    if (!logoFile || !mosqueId) return;
    const ext = logoFile.name.split(".").pop();
    const fileName = `${mosqueId}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("mosque-assets")
      .upload(fileName, logoFile, { upsert: true });
    if (error) {
      console.error("Upload logo error:", error);
      alert(`Gagal upload: ${error.message}`);
      return;
    }
    const publicUrl = supabase.storage.from("mosque-assets").getPublicUrl(fileName).data.publicUrl;
    const oldPath = extractStoragePath(logoUrl, "mosque-assets", mosqueId);
    if (oldPath && oldPath !== fileName) {
      await supabase.storage.from("mosque-assets").remove([oldPath]);
    }
    const { error: updateError } = await supabase
      .from("mosques")
      .update({ logo_url: publicUrl })
      .eq("id", mosqueId);
    if (updateError) {
      console.error("Update logo_url error:", updateError);
      alert(`Gagal simpan URL logo: ${updateError.message}`);
      return;
    }
    await logAuditAction({
      action: "Logo Upload",
      module: "Media",
      metadata: { file_name: logoFile.name },
    });
    setLogoUrl(publicUrl);
    setLogoFile(null);
    alert("Logo berhasil diupload");
  };

  const handleSave = async () => {
    if (!mosqueId) return;
    setSaving(true);
    const normalizedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");

    // Attempt upsert including postal_code; if column missing, retry without it.
    let updatedMosque: any = null;
    const buildPayload = (withPostal: boolean, withTagline: boolean, withDistrict: boolean) => ({
      id: mosqueId,
      name: name.trim(),
      slug: normalizedSlug || null,
      address: address.trim(),
      city: city.trim(),
      province: province.trim(),
      ...(withDistrict ? { district: districtName.trim() || null } : {}),
      ...(withPostal ? { postal_code: postalCode.trim() || null } : {}),
      ...(withTagline ? { tagline: tagline.trim() } : {}),
      logo_url: logoUrl || null,
    });
    const buildSelect = (withPostal: boolean, withTagline: boolean, withDistrict: boolean) =>
      ["name", "slug", "address", "city", "province", ...(withDistrict ? ["district"] : []), ...(withPostal ? ["postal_code"] : []), ...(withTagline ? ["tagline"] : []), "logo_url"].join(", ");
    const isColErr2 = (msg: string, col: string) =>
      msg.toLowerCase().includes(col) || msg.toLowerCase().includes(`column "${col}"`);

    let withPostal = postalColumnAvailable;
    let withTagline = taglineColumnAvailable;
    let withDistrict = districtColumnAvailable;

    for (let attempt = 0; attempt < 4; attempt++) {
      const resp = await supabase
        .from("mosques")
        .upsert([buildPayload(withPostal, withTagline, withDistrict)], { onConflict: "id" })
        .select(buildSelect(withPostal, withTagline, withDistrict))
        .single();
      if (!(resp as any).error) {
        updatedMosque = (resp as any).data;
        break;
      }
      const msg = ((resp as any).error?.message || "");
      if (isColErr2(msg, "district")) { withDistrict = false; continue; }
      if (isColErr2(msg, "tagline")) { withTagline = false; setTaglineColumnAvailable(false); continue; }
      if (isColErr2(msg, "postal_code")) { withPostal = false; setPostalColumnAvailable(false); continue; }
      setSaving(false);
      alert((resp as any).error.message || "Gagal menyimpan profil");
      return;
    }

    setSaving(false);

    if (updatedMosque) {
      setName(updatedMosque.name || "");
      setSlug(updatedMosque.slug || "");
      setAddress(updatedMosque.address || "");
      setCity(updatedMosque.city || "");
      setProvince(updatedMosque.province || "");
      if (withTagline && updatedMosque.tagline !== undefined) setTagline(updatedMosque.tagline || "");
      setLogoUrl(updatedMosque.logo_url || "");
      if (withPostal && updatedMosque.postal_code !== undefined) {
        setPostalCode(updatedMosque.postal_code || "");
      }
    }

    await logAuditAction({
      action: "Settings Update",
      module: "Settings",
      metadata: {
        name: name.trim(),
        slug: normalizedSlug || null,
        city: city.trim(),
        province: province.trim(),
      },
    });

    alert("Profil masjid berhasil disimpan");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const landingUrl = slug ? `${baseUrl}/m/${slug}` : "";
  const portalUrl = slug ? `${baseUrl}/masjid/${slug}` : "";
  const tvUrl = slug
    ? `${baseUrl}/tv/${slug}`
    : mosqueId
      ? `${baseUrl}/tv?mosque_id=${mosqueId}`
      : "";

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex">
        <AdminSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="h-10 w-48 bg-slate-800 rounded animate-pulse" />
            <div className="bg-slate-900 rounded-xl p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-800 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          <h1 className="text-4xl font-bold text-emerald-400">Pengaturan Masjid</h1>

          {/* LOGO */}
          <section className="bg-slate-900 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Logo Masjid</h2>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 text-xs">No Logo</div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="text-sm text-slate-400"
                />
                <button
                  onClick={handleUploadLogo}
                  disabled={!logoFile}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-1.5 rounded text-sm font-medium w-fit"
                >
                  Upload Logo
                </button>
              </div>
            </div>
          </section>

          {/* PROFILE FORM */}
          <section className="bg-slate-900 rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold mb-2">Profil</h2>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-slate-400">Nama Masjid</span>
              <input className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-slate-400">Slug (URL)</span>
              <input className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" placeholder="al-hidayah" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-slate-400">Alamat</span>
              <input className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" placeholder="Jl. Raya Soreang No. 123" value={address} onChange={(e) => setAddress(e.target.value)} />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-slate-400">Provinsi</span>
              <select
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                value={provinceId || ""}
                onChange={(e) => {
                  const v = e.target.value || undefined;
                  setProvinceId(v);
                  const prov = getProvinces().find((p) => p.id === v);
                  setProvince(prov?.name || "");
                  setCity("");
                  setCityId(undefined);
                  setDistrictId(undefined);
                  setDistrictName("");
                  setDistricts([]);
                  setPostalCode("");
                }}
              >
                <option value="">-- Pilih Provinsi (atau ketik manual di bawah) --</option>
                {getProvinces().map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-slate-400">Kota / Kabupaten</span>
              <select
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                value={cityId || ""}
                onChange={async (e) => {
                  const cId = e.target.value || undefined;
                  setCityId(cId);
                  setDistrictId(undefined);
                  setDistrictName("");
                  setDistricts([]);
                  setPostalCode("");
                  if (!provinceId || !cId) { setCity(""); return; }
                  const c = getCitiesForProvince(provinceId).find((x) => x.id === cId);
                  setCity(c?.name || "");
                  await fetchDistricts(provinceId, cId);
                }}
              >
                <option value="">-- Pilih Kota/Kabupaten (atau ketik manual di bawah) --</option>
                {getCitiesForProvince(provinceId).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-slate-400">Kecamatan (opsional)</span>
              <select
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                value={districtId || ""}
                onChange={(e) => {
                  const dId = e.target.value || undefined;
                  setDistrictId(dId);
                  const d = districts.find((x) => x.id === dId);
                  setDistrictName(d?.name || "");
                  if (d?.postal_codes?.[0]) setPostalCode(d.postal_codes[0]);
                  else if (dId) {
                    // fallback: try built-in lib
                    const pc = getPostalCodeForDistrict(provinceId, cityId, dId);
                    if (pc) setPostalCode(pc);
                  }
                }}
              >
                <option value="">-- Pilih Kecamatan --</option>
                {loadingDistricts
                  ? <option disabled>Memuat kecamatan...</option>
                  : districts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))
                }
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-slate-400">Jika tidak ada di daftar, ketik manual</span>
              <input
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                placeholder="Provinsi"
                value={province}
                onChange={(e) => {
                  // When user types a manual province, clear any dataset selection
                  setProvince(e.target.value);
                  setProvinceId(undefined);
                  // clear dependent fields to avoid mismatches
                  setCity("");
                  setCityId(undefined);
                  setDistrictId(undefined);
                  setDistrictName("");
                  setDistricts([]);
                  setPostalCode("");
                }}
              />
              <input
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 mt-2"
                placeholder="Kota"
                value={city}
                onChange={(e) => {
                  // Manual city input should override any dataset-derived city
                  setCity(e.target.value);
                  setCityId(undefined);
                  setDistrictId(undefined);
                  setDistrictName("");
                  setDistricts([]);
                  // leave provinceId intact if user still wants to keep province selection
                  setPostalCode("");
                }}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-slate-400">Kode Pos</span>
              <input className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" placeholder="Kode pos" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm text-slate-400">Tagline</span>
              <input className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" placeholder="Pusat Ibadah dan Pembinaan Umat" value={tagline} onChange={(e) => setTagline(e.target.value)} />
            </label>

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-6 py-2 rounded-lg font-semibold w-fit"
            >
              {saving ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </section>

          {/* URL PREVIEWS */}
          <section className="bg-slate-900 rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold mb-2">Link Publik</h2>

            {landingUrl && (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-400">Landing Page</span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-800 rounded-lg px-3 py-2 text-sm text-emerald-300 truncate">{landingUrl}</code>
                  <button
                    onClick={() => copyToClipboard(landingUrl, "landing")}
                    className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg text-sm shrink-0"
                  >
                    {copied === "landing" ? "✓" : "Copy"}
                  </button>
                  <a href={landingUrl} target="_blank" rel="noopener noreferrer" className="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg text-sm shrink-0">Buka</a>
                </div>
              </div>
            )}

            {portalUrl && (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-400">Portal Jamaah</span>
                <p className="text-xs text-slate-500">Halaman publik untuk jamaah. Berisi jadwal sholat, pengumuman, kajian, petugas, dan QRIS donasi.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-800 rounded-lg px-3 py-2 text-sm text-emerald-300 truncate">{portalUrl}</code>
                  <button
                    onClick={() => copyToClipboard(portalUrl, "portal")}
                    className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg text-sm shrink-0"
                  >
                    {copied === "portal" ? "✓" : "Copy"}
                  </button>
                  <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg text-sm shrink-0">Buka</a>
                </div>
              </div>
            )}

            {tvUrl && (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-slate-400">TV Display</span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-800 rounded-lg px-3 py-2 text-sm text-emerald-300 truncate">{tvUrl}</code>
                  <button
                    onClick={() => copyToClipboard(tvUrl, "tv")}
                    className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg text-sm shrink-0"
                  >
                    {copied === "tv" ? "✓" : "Copy"}
                  </button>
                  <a href={tvUrl} target="_blank" rel="noopener noreferrer" className="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg text-sm shrink-0">Buka</a>
                </div>
              </div>
            )}

            {!slug && (
              <p className="text-sm text-yellow-400">Isi slug di atas untuk mendapatkan link Landing Page.</p>
            )}
          </section>

          {/* AUDIO */}
          <section className="bg-slate-900 rounded-xl p-6 flex flex-col gap-5">
            <h2 className="text-lg font-semibold">Audio Adzan &amp; Alarm</h2>
            <p className="text-sm text-slate-400 -mt-3">Upload file audio untuk mengganti adzan dan alarm default di TV Display.</p>

            {/* Adzan */}
            <div className="flex flex-col gap-2">
              <span className="text-sm text-slate-400">Adzan (Dzuhur, Ashar, Maghrib, Isya)</span>
              {adzanUrl && <audio controls src={adzanUrl} className="w-full" />}
              <div className="flex gap-2 items-center">
                <input type="file" accept="audio/*" onChange={(e) => setAdzanFile(e.target.files?.[0] || null)} className="text-sm text-slate-400 flex-1" />
                <button
                  disabled={!adzanFile || !mosqueId}
                  onClick={async () => {
                    if (!adzanFile || !mosqueId) return;
                    const ext = adzanFile.name.split(".").pop();
                    const path = `${mosqueId}/adzan_url-${Date.now()}.${ext}`;
                    const { error } = await supabase.storage.from("mosque-assets").upload(path, adzanFile, { upsert: true });
                    if (error) { alert(`Gagal: ${error.message}`); return; }
                    const url = supabase.storage.from("mosque-assets").getPublicUrl(path).data.publicUrl;
                    await supabase.from("mosques").update({ adzan_url: url }).eq("id", mosqueId!);
                    setAdzanUrl(url); setAdzanFile(null); alert("Berhasil diupload");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-1.5 rounded text-sm font-medium shrink-0"
                >Upload</button>
              </div>
            </div>

            {/* Adzan Subuh */}
            <div className="flex flex-col gap-2">
              <span className="text-sm text-slate-400">Adzan Subuh</span>
              {adzanSubuhUrl && <audio controls src={adzanSubuhUrl} className="w-full" />}
              <div className="flex gap-2 items-center">
                <input type="file" accept="audio/*" onChange={(e) => setAdzanSubuhFile(e.target.files?.[0] || null)} className="text-sm text-slate-400 flex-1" />
                <button
                  disabled={!adzanSubuhFile || !mosqueId}
                  onClick={async () => {
                    if (!adzanSubuhFile || !mosqueId) return;
                    const ext = adzanSubuhFile.name.split(".").pop();
                    const path = `${mosqueId}/adzan_subuh_url-${Date.now()}.${ext}`;
                    const { error } = await supabase.storage.from("mosque-assets").upload(path, adzanSubuhFile, { upsert: true });
                    if (error) { alert(`Gagal: ${error.message}`); return; }
                    const url = supabase.storage.from("mosque-assets").getPublicUrl(path).data.publicUrl;
                    await supabase.from("mosques").update({ adzan_subuh_url: url }).eq("id", mosqueId!);
                    setAdzanSubuhUrl(url); setAdzanSubuhFile(null); alert("Berhasil diupload");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-1.5 rounded text-sm font-medium shrink-0"
                >Upload</button>
              </div>
            </div>

            {/* Alarm */}
            <div className="flex flex-col gap-2">
              <span className="text-sm text-slate-400">Alarm Iqomah</span>
              {alarmUrl && <audio controls src={alarmUrl} className="w-full" />}
              <div className="flex gap-2 items-center">
                <input type="file" accept="audio/*" onChange={(e) => setAlarmFile(e.target.files?.[0] || null)} className="text-sm text-slate-400 flex-1" />
                <button
                  disabled={!alarmFile || !mosqueId}
                  onClick={async () => {
                    if (!alarmFile || !mosqueId) return;
                    const ext = alarmFile.name.split(".").pop();
                    const path = `${mosqueId}/alarm_url-${Date.now()}.${ext}`;
                    const { error } = await supabase.storage.from("mosque-assets").upload(path, alarmFile, { upsert: true });
                    if (error) { alert(`Gagal: ${error.message}`); return; }
                    const url = supabase.storage.from("mosque-assets").getPublicUrl(path).data.publicUrl;
                    await supabase.from("mosques").update({ alarm_url: url }).eq("id", mosqueId!);
                    setAlarmUrl(url); setAlarmFile(null); alert("Berhasil diupload");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-1.5 rounded text-sm font-medium shrink-0"
                >Upload</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
