import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Next.js 16 Proxy — proteksi server-side untuk route /dashboard/**
 *
 * Menggunakan @supabase/ssr yang menangani chunked cookies secara otomatis.
 * Supabase Auth v2 menyimpan session dalam beberapa cookie chunks
 * (sb-{ref}-auth-token.0, .1, dst) — @supabase/ssr handle ini dengan benar.
 */

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hanya proteksi /dashboard dan semua sub-route-nya
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // Siapkan response yang bisa kita modifikasi (untuk refresh cookie jika perlu)
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Buat Supabase client yang baca/tulis cookies dari request/response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          // Update cookies di request dan response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Verifikasi session — getUser() lebih aman dari getSession()
  // karena validasi token ke server Supabase, bukan hanya dari cookie
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    // Tidak terautentikasi → redirect ke login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Terautentikasi → lanjutkan, kembalikan response (dengan cookie yang sudah di-refresh)
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
