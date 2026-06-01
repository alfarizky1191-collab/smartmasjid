---
inclusion: always
---

# Technology Stack

This is a Next.js 16 app using the App Router and React 19.

## Primary Stack

- Framework: Next.js 16 with `src/app` routes.
- React: React 19 client components.
- Language: TypeScript with strict mode enabled.
- Styling: Tailwind CSS 4 via `src/app/globals.css`.
- UI foundation: shadcn-style components in `src/components/ui`, configured by `components.json`.
- Data/backend: Supabase client from `src/lib/supabase/client.ts`.
- Charts: Recharts for finance charting.
- PDF export: `jspdf` and `jspdf-autotable`.
- Icons: `lucide-react` is available when icon buttons are needed.

## Runtime Integrations

- Supabase tables currently used include `mosques`, `slides`, `announcements`, `transactions`, `donations`, `qris_settings`, and `events`.
- Supabase Storage buckets currently referenced include `mosque-assets`, `slides`, and `qris`.
- Prayer times are fetched from Aladhan using `timingsByCity` with Indonesian city data from the mosque record.
- Audio assets live in `public/audio`.

## Commands

- Start dev server: `npm run dev`
- Build: `npm run build`
- Production start after build: `npm run start`

## Current Constraints

- `AGENTS.md` says this project uses a Next.js version with breaking changes. Read relevant local Next docs under `node_modules/next/dist/docs/` before changing framework APIs or routing conventions.
- Environment variables must stay out of source control. Supabase client expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Do not add secrets, service-role keys, or private Supabase credentials to steering files, source files, or examples.

#[[file:package.json]]
#[[file:components.json]]
#[[file:src/lib/supabase/client.ts]]

