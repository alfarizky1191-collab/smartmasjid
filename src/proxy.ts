import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js 16 Proxy
 *
 * Proteksi dashboard ditangani di client-side (useEffect + supabase.auth.getUser)
 * di setiap halaman dashboard. Server-side proxy dengan Supabase localStorage-based
 * auth tidak bisa membaca session dari cookie karena Supabase JS v2 default
 * menyimpan session di localStorage, bukan cookie.
 *
 * Untuk aktifkan kembali server-side protection, perlu migrasi ke
 * @supabase/ssr dengan cookie-based session storage di seluruh app.
 */

export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
