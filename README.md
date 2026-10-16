# VERDENT

A personal wellness companion for nutrition, affordable meals, a free-time
planner, and a home microgreens garden — built around an actual student week
rather than an idealised one.

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>, create an account, and answer a few optional
questions. That is the whole setup — no database server, no API keys, no
configuration.

```bash
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

---

## What it does

| Area | What you get |
| --- | --- |
| **Dashboard** | Greeting, at most three priorities, today's nutrition, budget, tray status, free time, checklist and insights — all derived from real entries only. |
| **What should I eat?** | A daily meal plan built from food actually in your pantry, with cost, time, ingredients, substitutions, and an honest report when your pantry cannot balance a day. |
| **My food pantry** | What you own, what it cost, when it expires. Prices are *yours* — reference prices are explicitly labelled placeholders. |
| **Nutrition** | Meal logging with server-computed macros, daily and weekly trends, every value badged as an estimate or verified. |
| **Shopping list** | Missing essentials split from optional extras, pantry stock deducted, with real-spend tracking against your budget. |
| **My tiny garden** | One tray per batch, eight stages, per-variety care guides, photo timeline, reminders, and cautious troubleshooting. |
| **Free time** | Your timetable → realistic gaps → gardening tasks that actually fit. Never double-books a class. |
| **Wellness journal** | Sleep, energy, mood, water, movement — optional per category, private, neutral language. |
| **Reports** | Weekly and monthly summaries across food, spending, pantry and garden, plus full data export. |
| **Settings** | Profile, tracking opt-outs, theme, export, and permanent account deletion. |

---

## Design principles held throughout

**No calorie targets.** The brief rules out presuming someone wants to lose
weight. VERDANT shows what you ate and a plate-based balance guide; it never
issues an intake target, a deficit, or a weight figure.

**Estimates are labelled.** All nutrition values come from rounded published
composition tables. They are `confidence: "estimated"` in the data model and
carry a visible **Estimate** badge in the UI.

**Nothing is invented.** The planner only composes meals from items in *your*
pantry. If it needs something you do not have, it says so and adds it to the
shopping list rather than quietly assuming it exists.

**Honest about limits.** VERDANT cannot tell mould from root hairs from a
description, so it never claims a tray is safe — it advises discarding when in
doubt, and it never promises food will treat or prevent anything.

**No guilt.** Missed habits produce a reschedule, not a backlog. Nothing ranks
your worth by body size, calories or consistency.

---

## Architecture

```
src/
├── proxy.ts              # Cheap presence-only auth redirect
├── app/
│   ├── layout.tsx        # Fonts, theme bootstrap script
│   ├── globals.css       # Design tokens + every keyframe
│   ├── page.tsx          # Marketing landing page
│   ├── (auth)/           # login / signup, split-screen with the sprout
│   ├── onboarding/       # 9-step wizard
│   ├── (app)/            # The signed-in shell and all modules
│   └── api/              # JSON route handlers
├── components/           # UI primitives + motion pieces
└── lib/
    ├── db.ts             # node:sqlite schema + migrations
    ├── repo.ts           # All data access, scoped by user id
    ├── auth.ts           # scrypt hashing, sessions, rate limiting
    ├── planner.ts        # The meal-plan engine
    ├── insights.ts       # Free-time detection, priorities, insights
    ├── validation.ts     # Zod schemas with human-readable messages
    └── data/             # foods.ts, microgreens.ts reference data
```

### Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript**
- **Tailwind CSS v4** — tokens via `@theme`, colours as runtime CSS variables
  so light and dark mode share one set of utilities
- **Recharts** for charts, **Motion** available, and **lucide-react** for icons
- **node:sqlite** for persistence — zero-config, but the schema is the shape a
  hosted Postgres deployment would use
- **Zod** for every request body

### Why SQLite

It runs with no external service or credential, which is the point — the app
should work the second you clone it. Every read and write in `repo.ts` is
scoped by `user_id`, which is where cross-account access is prevented. To move
to a hosted database, implement the same function surface in a new module and
swap the import; nothing above that layer knows which store is in use.

### Auth

- scrypt password hashing with a per-user salt, compared in constant time
- Opaque 32-byte session tokens; only a SHA-256 hash is stored, so a database
  leak never hands over a live session
- `httpOnly` + `sameSite=lax` cookie, `secure` in production
- In-memory login throttling (8 attempts / 15 min) and an identical-time
  response for unknown emails so timing does not reveal account existence
- `proxy.ts` checks only whether a cookie is *present*; `requireUser()` in each
  protected page is the real access-control boundary

### The two motion pieces

Both are hand-built SVG driven by CSS keyframes in `globals.css` — no animation
library, crisp at any size, and fully disabled under `prefers-reduced-motion`.

**`Sprout`** (garden) — one continuous timeline drives seed → split → roots →
stem drawing itself upward → cotyledons unfurling → true leaves opening → a
gentle sway, with misting droplets and staggered sibling seedlings. The whole
sequence is scaled by a single `--cycle` custom property. `TrayPreview` gives
the static, stage-proportional version used on tray cards.

**`FitnessMotion`** (wellness) — a runner whose limbs counter-swing and whose
body bobs, expanding impact rings under the feet, a drifting ECG pulse trace,
and concentric activity rings that sweep in behind a rotating highlight.

---

## Privacy and safety

- All wellness data is private to the account. Nothing is sold or shared.
- Tracking is opt-out per category; a disabled category collects nothing.
- Full JSON export and permanent account deletion (password re-confirmed).
- Uploads are validated by **magic bytes**, not the browser's Content-Type, and
  stored under random filenames outside `public/`, served only through a route
  that verifies ownership first.
- The app is not a medical device, does not diagnose, and does not give medical
  advice.

---

## Deployment

Any Node host works. The app is a standard Next.js server.

1. Set `SESSION_SECRET` to a 32+ character random string. **Required in
   production** — without it, sessions reset on every restart.
2. Ensure the process can write to its data directory (SQLite database and
   uploaded photos). On a serverless platform, mount a volume and point
   `VERDENT_DB_PATH` and `UPLOAD_DIR` at it.
3. `npm run build && npm run start`.

```bash
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

See `.env.example` for every supported variable.

---

## Testing the full journey

1. Create an account at `/signup`.
2. Complete onboarding — or press **Skip to the end** on any step.
3. **Settings → Load sample data** to explore with a populated pantry and three
   trays.
4. **My food pantry** → add a food with a real price you paid.
5. **What should I eat today?** → generate a plan, mark a meal eaten, swap a
   meal for a cheaper alternative.
6. **Nutrition** → log a meal; check the totals update.
7. **My tiny garden** → start a tray, advance its stage, add a photo.
8. **Wellness journal** → log sleep, energy and water.
9. **Settings → Export my data** to confirm everything is included.