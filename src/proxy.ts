import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Next.js Middleware — proteksi server-side untuk route /dashboard/**
 *
 * Logika:
 * 1. Baca access token dari cookie Supabase Auth
 * 2. Verifikasi token ke Supabase
 * 3. Jika tidak valid → redirect ke /login
 * 4. Jika valid → lanjutkan request
 *
 * Middleware ini berjalan di Edge Runtime (sebelum halaman di-render),
 * sehingga bot/crawler tidak bisa mengakses HTML dashboard sama sekali.
 */

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cookie name yang dipakai Supabase Auth JS v2
// Format: sb-<project-ref>-auth-token
function getAuthCookieName(): string {
  try {
    const ref = new URL(SUPABASE_URL).hostname.split(".")[0];
    return `sb-${ref}-auth-token`;
  } catch {
    return "sb-auth-token";
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hanya proteksi /dashboard dan semua sub-route-nya
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // Ambil token dari cookie Supabase
  const cookieName  = getAuthCookieName();
  const cookieValue = request.cookies.get(cookieName)?.value;

  // Coba juga format base64 chunked yang dipakai Supabase Auth v2
  let accessToken: string | null = null;

  if (cookieValue) {
    try {
      // Cookie bisa berupa JSON string atau base64
      const decoded = decodeURIComponent(cookieValue);
      let parsed: { access_token?: string } | null = null;

      if (decoded.startsWith("{")) {
        parsed = JSON.parse(decoded);
      } else {
        // base64url
        parsed = JSON.parse(atob(decoded));
      }

      accessToken = parsed?.access_token ?? null;
    } catch {
      // Gagal parse — token tidak valid
      accessToken = null;
    }
  }

  // Jika tidak ada token sama sekali, redirect ke login langsung
  if (!accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verifikasi token ke Supabase
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new Error("Token tidak valid");
    }

    // Token valid — lanjutkan request
    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
