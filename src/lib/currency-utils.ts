/**
 * Indonesian Rupiah currency helpers.
 *
 * Design contract:
 *  - The numeric value (integer) is always what gets stored in Supabase.
 *  - These helpers only format/parse for the UI layer.
 */

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format a number as "Rp 1.250.000".
 * Safe to call with null / undefined — returns "Rp 0".
 */
export function formatRupiah(value: number | null | undefined): string {
  const n = typeof value === "number" && isFinite(value) ? value : 0;
  return `Rp ${rupiahFormatter.format(n)}`;
}

/**
 * Strip everything except digits and return a plain integer.
 * "Rp 1.250.000" → 1250000
 * ""             → 0
 */
export function parseRupiah(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  return digits === "" ? 0 : parseInt(digits, 10);
}

/**
 * Format a raw input string on-the-fly while the user is typing.
 *
 * Removes non-digit characters, parses the integer, and returns a
 * display string with thousand-separators and "Rp " prefix so the
 * input always looks like a formatted currency field.
 *
 * Examples:
 *   "1000"      → "Rp 1.000"
 *   "100000"    → "Rp 100.000"
 *   "1250000"   → "Rp 1.250.000"
 *   ""          → ""           (empty → let placeholder show)
 */
export function formatRupiahInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits === "" || digits === "0") return "";
  const n = parseInt(digits, 10);
  return `Rp ${rupiahFormatter.format(n)}`;
}
