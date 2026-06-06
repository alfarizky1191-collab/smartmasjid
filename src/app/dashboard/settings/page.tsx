"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AdminSidebar from "@/components/Adminsidebar";
import {
  getProvinces,
  findProvinceByName,
  findCityByName,
  getCitiesForProvince,
  getDistrictsForCity,
  getPostalCodeForDistrict,
} from "@/lib/indonesia-locations";
import { setRuntimeProvinces } from "@/lib/indonesia-locations";

export default function SettingsPage() {
  const [mosqueId, setMosqueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [provinceId, setProvinceId] = useState<string | undefined>(undefined);
  const [postalCode, setPostalCode] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState("");
  const [postalColumnAvailable, setPostalColumnAvailable] = useState(true);
  const [taglineColumnAvailable, setTaglineColumnAvailable] = useState(true);

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
        .select("mosque_id")
        .eq("id", user.id)
        .single();

      if (!profile?.mosque_id) { setLoading(false); return; }
      setMosqueId(profile.mosque_id);

      // Fetch mosque profile. Some deployments may not have `postal_code` or `tagline` columns.
      let mosque: any = null;
      let localPostalAvail = true;
      let localTaglineAvail = true;

      const tryFetch = async (withPostal: boolean, withTagline: boolean) => {
        const cols = ["name", "slug", "address", "city", "province", ...(withPostal ? ["postal_code"] : []), ...(withTagline ? ["tagline"] : []), "logo_url"].join(", ");
        return supabase.from("mosques").select(cols).eq("id", profile.mosque_id).single();
      };

      const isColErr = (msg: string, col: string) =>
        msg.toLowerCase().includes(col) || msg.toLowerCase().includes(`column "${col}"`);

      let resp = await tryFetch(true, true);
      if ((resp as any).error) {
        const msg = ((resp as any).error?.message || "").toLowerCase();
        if (isColErr(msg, "tagline")) { localTaglineAvail = false; setTaglineColumnAvailable(false); }
        if (isColErr(msg, "postal_code")) { localPostalAvail = false; setPostalColumnAvailable(false); }
        if (!localPostalAvail || !localTaglineAvail) {
          // Recovered via column fallback — retry silently
          resp = await tryFetch(localPostalAvail, localTaglineAvail);
          if ((resp as any).error) {
            const e = (resp as any).error;
            console.warn("Mosque profile fetch failed after fallback:", e?.message || e?.code || JSON.stringify(e));
          }
        } else {
          // Not a column error — log with detail
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
            // try to auto-fill postal code from first district if available
            const districts = getDistrictsForCity(provMatch.id, cityMatch.id);
            if (districts && districts.length > 0) {
              setPostalCode(districts[0].postal_codes?.[0] || ((mosque.postal_code as any) || ""));
            } else {
              setPostalCode(((mosque.postal_code as any) || "") as string);
            }
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
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleUploadLogo = async () => {
    if (!logoFile || !mosqueId) return;
    const fileName = `${Date.now()}-${logoFile.name}`;
    const { error } = await supabase.storage.from("mosque-assets").upload(fileName, logoFile);
    if (error) { alert(error.message); return; }
    const publicUrl = supabase.storage.from("mosque-assets").getPublicUrl(fileName).data.publicUrl;
    await supabase.from("mosques").update({ logo_url: publicUrl }).eq("id", mosqueId);
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
    const buildPayload = (withPostal: boolean, withTagline: boolean) => ({
      id: mosqueId,
      name: name.trim(),
      slug: normalizedSlug || null,
      address: address.trim(),
      city: city.trim(),
      province: province.trim(),
      ...(withPostal ? { postal_code: postalCode.trim() || null } : {}),
      ...(withTagline ? { tagline: tagline.trim() } : {}),
      logo_url: logoUrl || null,
    });
    const buildSelect = (withPostal: boolean, withTagline: boolean) =>
      ["name", "slug", "address", "city", "province", ...(withPostal ? ["postal_code"] : []), ...(withTagline ? ["tagline"] : []), "logo_url"].join(", ");
    const isColErr2 = (msg: string, col: string) =>
      msg.toLowerCase().includes(col) || msg.toLowerCase().includes(`column "${col}"`);

    let withPostal = postalColumnAvailable;
    let withTagline = taglineColumnAvailable;

    for (let attempt = 0; attempt < 3; attempt++) {
      const resp = await supabase
        .from("mosques")
        .upsert([buildPayload(withPostal, withTagline)], { onConflict: "id" })
        .select(buildSelect(withPostal, withTagline))
        .single();
      if (!(resp as any).error) {
        updatedMosque = (resp as any).data;
        break;
      }
      const msg = ((resp as any).error?.message || "");
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

    alert("Profil masjid berhasil disimpan");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const landingUrl = slug ? `${baseUrl}/m/${slug}` : "";
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
                value={(() => {
                  const cities = getCitiesForProvince(provinceId);
                  const match = cities.find((c) => c.name === city);
                  return match?.id || "";
                })()}
                onChange={(e) => {
                  const cityId = e.target.value || undefined;
                  if (!provinceId || !cityId) {
                    setCity("");
                    setPostalCode("");
                    return;
                  }
                  const c = getCitiesForProvince(provinceId).find((x) => x.id === cityId);
                  setCity(c?.name || "");
                  const districts = getDistrictsForCity(provinceId, cityId);
                  if (districts && districts.length > 0) {
                    setPostalCode(districts[0].postal_codes?.[0] || "");
                  } else {
                    setPostalCode("");
                  }
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
                onChange={(e) => {
                  const districtId = e.target.value || undefined;
                  // determine selected city id
                  const cities = getCitiesForProvince(provinceId);
                  const selectedCity = cities.find((c) => c.name === city);
                  const cityId = selectedCity?.id;
                  if (!provinceId || !cityId || !districtId) return;
                  const pc = getPostalCodeForDistrict(provinceId, cityId, districtId);
                  if (pc) setPostalCode(pc);
                }}
              >
                <option value="">-- Pilih Kecamatan (jika tersedia) --</option>
                {provinceId && (() => {
                  const cities = getCitiesForProvince(provinceId);
                  const selectedCity = cities.find((c) => c.name === city);
                  return (selectedCity?.districts || []).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ));
                })()}
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
                </div>
              </div>
            )}

            {!slug && (
              <p className="text-sm text-yellow-400">Isi slug di atas untuk mendapatkan link Landing Page.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
