# Live Shared Grocery List

Real-time family grocery list with a master catalog, weekly shopping list, item
quantities, per-store aisle ordering, and live sync across everyone's phones.

**Stack:** React + Vite (static SPA on Vercel) · Supabase Postgres + Realtime + Presence.

There is no backend server to run. The browser talks to Supabase directly:
Postgres stores the data, Realtime pushes row changes to every device in the room,
and Presence tracks who is currently shopping.

---

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), and run it.
   It creates the `rooms`, `stores`, `items`, and `activity` tables, the RLS
   policies, and adds all four tables to the Realtime publication. Re-running it
   is safe.
3. Go to **Project Settings → API** and copy the **Project URL** and the
   **anon / public** key.

No seed data is needed — the app creates a room and loads the starter catalog from
`src/data/initialData.ts` the first time a room code is opened.

## 2. Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the two values from step 1.3
npm run dev
```

## 3. Deploy to Vercel

1. Push this repo to GitHub and import it at [vercel.com/new](https://vercel.com/new).
   `vercel.json` already sets the build command and output directory.
2. Under **Project Settings → Environment Variables**, add both variables for
   Production, Preview, and Development:

   | Name | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | your anon / public key |

   These are read at **build time** and inlined into the bundle, so changing them
   requires a redeploy, not just a restart.
3. Deploy.

## Sharing a list

A list is identified by a room code in the URL: `?room=FAMILY-LIST`. Anyone who
opens that link joins the same live list; opening an unused code creates a new
list seeded with the starter catalog. Codes are normalized to `A–Z`, `0–9`, and
hyphens.

## Security

This deployment is **intentionally open** — the room code is the only secret. The
RLS policies in the migration grant the `anon` role full read/write on every row,
which matches how the original WebSocket server behaved (it had no auth either).
Anyone who knows or guesses a room code can read and modify that list, so use a
long, non-obvious code and treat lists as public-ish.

To lock it down later, add Supabase Auth and a `room_members` table, then replace
the four `open access` policies with membership checks. The schema itself does not
need to change.

The anon key is meant to be public and is safe in the client bundle. Never put a
`service_role` key in a `VITE_`-prefixed variable — Vite inlines those into
browser code.

## Notes

- `activity` rows accumulate; the UI only reads the 50 most recent. Add a
  scheduled cleanup (pg_cron) if a long-lived list grows large.
- Product categories and aisle metadata live in code (`src/data/initialData.ts`),
  not in the database — only per-store aisle *ordering* is stored per room.
