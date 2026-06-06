// Minimal Indonesia locations dataset for cascading selects.
// Source for full dataset: https://github.com/edwardsamuel/Wilayah-Administratif-Indonesia
// This file includes a compact subset for UX; mapping functions are provided
// so the data can be extended or replaced with a full dataset without changing the UI.

export type District = { id: string; name: string; postal_codes?: string[] };
export type City = { id: string; name: string; districts?: District[] };
export type Province = { id: string; name: string; cities?: City[] };

// A compact sample dataset — extend or replace with full dataset as needed.
export const PROVINCES: Province[] = [
  {
    id: "jkt",
    name: "DKI Jakarta",
    cities: [
      { id: "jakpus", name: "Jakarta Pusat", districts: [
        { id: "gambir", name: "Gambir", postal_codes: ["10110"] },
        { id: "menteng", name: "Menteng", postal_codes: ["10310"] },
      ]},
      { id: "jaksel", name: "Jakarta Selatan", districts: [
        { id: "cilandak", name: "Cilandak", postal_codes: ["12430"] },
        { id: "kebayoranbaru", name: "Kebayoran Baru", postal_codes: ["12110"] },
      ]},
    ],
  },
  {
    id: "jabar",
    name: "Jawa Barat",
    cities: [
      { id: "bandung", name: "Bandung", districts: [
        { id: "coblong", name: "Coblong", postal_codes: ["40135"] },
        { id: "bandungan", name: "Bandungan", postal_codes: ["40199"] },
      ]},
      { id: "sumedang", name: "Sumedang", districts: [
        { id: "sumedangsel", name: "Sumedang Selatan", postal_codes: ["45311"] },
      ]},
    ],
  },
  {
    id: "jawatim",
    name: "Jawa Timur",
    cities: [
      { id: "surabaya", name: "Surabaya", districts: [
        { id: "sbytengah", name: "Genteng", postal_codes: ["60275"] },
      ]},
    ],
  },
  {
    id: "jawateng",
    name: "Jawa Tengah",
    cities: [
      { id: "semarang", name: "Semarang", districts: [
        { id: "ngaliyan", name: "Ngaliyan", postal_codes: ["50181"] },
      ]},
    ],
  },
];

let RUNTIME_PROVINCES: Province[] | null = null;

export function setRuntimeProvinces(data: Province[] | null) {
  RUNTIME_PROVINCES = data;
}

export function getProvinces(): Province[] {
  return RUNTIME_PROVINCES || PROVINCES;
}

export function findProvinceByName(name: string | undefined): Province | undefined {
  if (!name) return undefined;
  const q = name.trim().toLowerCase();
  return getProvinces().find((p) => p.name.toLowerCase() === q || p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase()));
}

export function getCitiesForProvince(provinceId: string | undefined): City[] {
  if (!provinceId) return [];
  const p = getProvinces().find((pr) => pr.id === provinceId);
  return p?.cities || [];
}

export function findCityByName(provinceId: string | undefined, cityName: string | undefined): City | undefined {
  if (!provinceId || !cityName) return undefined;
  const cities = getCitiesForProvince(provinceId);
  const q = cityName.trim().toLowerCase();
  return cities.find((c) => c.name.toLowerCase() === q || c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase()));
}

export function getDistrictsForCity(provinceId: string | undefined, cityId: string | undefined): District[] {
  if (!provinceId || !cityId) return [];
  const cities = getCitiesForProvince(provinceId);
  const c = cities.find((x) => x.id === cityId);
  return c?.districts || [];
}

export function getPostalCodeForDistrict(provinceId: string | undefined, cityId: string | undefined, districtId: string | undefined): string | undefined {
  if (!provinceId || !cityId || !districtId) return undefined;
  const districts = getDistrictsForCity(provinceId, cityId);
  const d = districts.find((x) => x.id === districtId);
  return d?.postal_codes?.[0];
}

export default PROVINCES;
