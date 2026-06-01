---
inclusion: always
---

# Product Overview

SmartMasjid is a mosque operations dashboard and TV display app for Indonesian mosques.

## Users

- Mosque administrators manage content, finance records, QRIS donations, events, and TV settings from `/dashboard`.
- Congregants and visitors see the public display at `/tv`.

## Core Flows

- Admin login uses Supabase Auth and redirects authenticated users to `/dashboard`.
- The dashboard manages mosque profile display data, logo, running text, iqomah duration, announcement text, and slide images.
- Finance pages track income and expense transactions and can export a PDF report.
- Donation pages manage QRIS imagery and donation records, also recording donations as income transactions.
- Event pages manage upcoming mosque activities and speakers.
- TV display shows mosque identity, current time, prayer countdown, iqomah countdown, announcements, slides, QRIS donation prompt, recent donations, upcoming events, and adzan audio.

## Product Priorities

- Favor clear, reliable operation on a large mosque TV screen.
- Keep admin workflows simple and explicit: upload, save, delete, confirm.
- Prefer Indonesian UI copy for user-facing text.
- Preserve the existing dark slate and emerald visual identity unless a task explicitly asks for redesign.
- Avoid adding unnecessary marketing pages; the app should open directly into useful product surfaces.

