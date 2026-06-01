---
inclusion: always
---

# Project Structure

## Important Paths

- `src/app/page.tsx`: simple public landing/home surface.
- `src/app/login/page.tsx`: Supabase Auth login.
- `src/app/dashboard/page.tsx`: main mosque admin dashboard for logo, slides, TV settings, and announcements.
- `src/app/dashboard/finance/page.tsx`: finance transaction dashboard and PDF export.
- `src/app/dashboard/donasi/page.tsx`: QRIS and donation management.
- `src/app/dashboard/events/page.tsx`: mosque event schedule management.
- `src/app/tv/page.tsx`: full-screen mosque TV display and realtime public view.
- `src/components/Adminsidebar.tsx`: shared admin sidebar. Note the filename casing is `Adminsidebar.tsx`.
- `src/components/ui`: reusable shadcn-style UI primitives.
- `src/lib/supabase/client.ts`: browser Supabase client.
- `public/audio`: adzan and alarm audio files.

## Route Patterns

- App Router route files are colocated under `src/app/**/page.tsx`.
- Most interactive pages are client components and start with `"use client"`.
- Admin dashboard pages share the sidebar and use Tailwind utility classes directly.

## Naming And Imports

- Use the `@/*` path alias for imports from `src`.
- Preserve exact file casing in imports. On this project, import the admin sidebar as `@/components/Adminsidebar`.
- Keep Supabase browser client imports centralized through `@/lib/supabase/client`.

## Data Flow

- Dashboard pages read and write Supabase directly from client components.
- TV page subscribes to Supabase realtime channels for mosque settings, announcements, donations, and events.
- Uploaded images are stored in Supabase Storage and persisted as public URLs in database records.

#[[file:src/app/dashboard/page.tsx]]
#[[file:src/app/tv/page.tsx]]
#[[file:src/components/Adminsidebar.tsx]]

