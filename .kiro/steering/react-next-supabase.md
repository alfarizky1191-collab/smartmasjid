---
inclusion: fileMatch
fileMatchPattern: ["src/**/*.ts", "src/**/*.tsx"]
---

# React, Next.js, And Supabase Guidance

## React And UI

- Use client components only when interactivity, browser APIs, or Supabase browser calls are needed.
- Keep UI copy in Indonesian for admin and TV surfaces.
- Match the existing admin visual language: slate backgrounds, emerald primary actions, red destructive actions, yellow edit/status actions.
- For TV surfaces, prioritize large readable text, stable layout dimensions, and full-screen readability.
- Avoid nested decorative card structures. Use cards for actual grouped controls or repeated records.
- Add responsive constraints when grids or buttons may overflow on smaller screens.

## State And Effects

- Keep async loaders small and named by domain, such as `loadDonations` or `loadEvents`.
- Clean up Supabase realtime channels in `useEffect` returns with `supabase.removeChannel`.
- Clean up timers and intervals when components unmount.
- Avoid duplicating adzan, countdown, or realtime logic without first checking `src/app/tv/page.tsx`.

## Supabase

- Handle Supabase `error` results for writes and uploads when changing production-facing flows.
- Use explicit table names that already exist unless a task includes a database migration plan.
- Keep storage bucket names consistent with existing code: `mosque-assets`, `slides`, and `qris`.
- Never expose service-role keys in client code.

## Validation

- For code changes, run `npm run build` before considering the work done when feasible.
- Treat Recharts prerender size warnings as separate UI issues unless the current task is chart-related.

