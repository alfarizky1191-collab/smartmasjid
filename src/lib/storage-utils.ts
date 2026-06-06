/**
 * Extracts the storage object path from a Supabase public URL.
 *
 * Returns the path segment after `/storage/v1/object/public/{bucket}/`
 * only if it starts with `{mosqueId}/` — ensuring we never delete a file
 * belonging to a different mosque or an old flat-path upload.
 *
 * Returns null for:
 *  - old flat-path files (no mosqueId prefix)
 *  - external URLs
 *  - empty/missing URLs
 */
export function extractStoragePath(
  publicUrl: string,
  bucket: string,
  mosqueId: string
): string | null {
  if (!publicUrl || !mosqueId) return null;
  try {
    const url = new URL(publicUrl);
    const prefix = `/storage/v1/object/public/${bucket}/`;
    if (!url.pathname.startsWith(prefix)) return null;
    const path = url.pathname.slice(prefix.length);
    // Only allow deletion of files inside this mosque's folder
    if (!path.startsWith(`${mosqueId}/`)) return null;
    return path;
  } catch {
    return null;
  }
}
