# Cipher Clash ⚔️

**Cipher Clash** is a daily competitive Wordle-like web game where players race the clock to guess a hidden word, earn scores, and compete on daily and weekly leaderboards.

---

## Features

- 🎮 **Daily puzzle** — word length randomly 5, 6, or 7 letters (same for all players, set by HMAC)
- ⏱ **Server-side timer** — starts on first keypress, computed server-side to prevent cheating
- 🟩 **Accurate Wordle rules** — correct duplicate-letter evaluation
- 🏆 **Leaderboards** — daily and weekly, scored by points then solve time
- 🔐 **Google login** via Supabase Auth
- ⚔️ **Battle Pass** — free track + paid Premium track ($2.99 one-time via Stripe) with themes, badges, titles, effects and more
- 📱 **Mobile-first responsive UI** — touch keyboard, bottom nav, adaptive layouts
- 🎨 **Colorblind mode** — toggle for orange/blue tiles instead of green/yellow

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Fastify + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | Supabase Auth (Google OAuth) |
| Payments | Stripe Checkout |
| Monorepo | pnpm workspaces |

---

## Project Structure

```
cypher-crash/
├── apps/
│   ├── api/          # Fastify API server
│   └── web/          # React + Vite frontend
├── packages/
│   └── shared/       # Shared types + Wordle evaluation logic
├── package.json      # Workspace root
└── pnpm-workspace.yaml
```

---

## Local Development Setup

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8 (`npm install -g pnpm`)
- PostgreSQL running locally (or use a free cloud DB like [Neon](https://neon.tech) or [Supabase](https://supabase.com))

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

**API (`apps/api/.env`):**
```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your values:
#   DATABASE_URL       — PostgreSQL connection string
#   SUPABASE_URL       — Your Supabase project URL
#   SUPABASE_JWT_SECRET — Found in Supabase → Project Settings → API → JWT Secret
#   DAILY_SECRET       — Any long random string
#   STRIPE_SECRET_KEY  — (optional for dev) Stripe secret key
#   STRIPE_BATTLE_PASS_PRICE_ID — (optional) Stripe Price ID for $2.99 pass
```

**Web (`apps/web/.env`):**
```bash
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env:
#   VITE_SUPABASE_URL      — Your Supabase project URL
#   VITE_SUPABASE_ANON_KEY — Supabase anon/public key
```

### 3. Run database migrations

```bash
pnpm --filter api db:migrate
```

### 4. Seed word lists + initial Battle Pass season

```bash
pnpm --filter api seed
```

### 5. Start both servers (one command)

```bash
pnpm dev
```

- **Web** → [http://localhost:5173](http://localhost:5173)
- **API** → [http://localhost:3001](http://localhost:3001)

---

## Supabase Setup (Google Auth)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Authentication → Providers → Google** and enable it (you'll need a Google OAuth app from [Google Console](https://console.cloud.google.com)).
3. Add `http://localhost:5173` to **Redirect URLs** in Supabase Auth settings.
4. Copy your **Project URL** and **anon key** to `apps/web/.env`.
5. Copy your **JWT Secret** to `apps/api/.env` as `SUPABASE_JWT_SECRET`.

---

## Stripe Setup (Battle Pass payments)

1. Create a product in [Stripe Dashboard](https://dashboard.stripe.com) → Products → **Cipher Clash Premium Battle Pass**, price = **$2.99 one-time**.
2. Copy the **Price ID** (`price_...`) to `apps/api/.env` as `STRIPE_BATTLE_PASS_PRICE_ID`.
3. Copy your **Secret Key** to `STRIPE_SECRET_KEY`.
4. For webhooks (local dev): use [Stripe CLI](https://stripe.com/docs/stripe-cli): `stripe listen --forward-to localhost:3001/api/battlepass/webhook` and copy the webhook secret to `STRIPE_WEBHOOK_SECRET`.

> **Dev shortcut**: If `STRIPE_SECRET_KEY` is blank, `POST /api/battlepass/upgrade` immediately activates the premium pass without payment (useful for local testing).

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/daily` | ✅ | Today's puzzle state |
| POST | `/api/daily/start` | ✅ | Start timer (idempotent, called on first keypress) |
| POST | `/api/daily/guess` | ✅ | Submit a guess `{ guess }` |
| GET | `/api/leaderboards/daily?date=&limit=` | — | Daily leaderboard |
| GET | `/api/leaderboards/weekly?weekStart=&limit=` | — | Weekly leaderboard |
| GET | `/api/me/rank/daily?date=` | ✅ | Your daily rank |
| GET | `/api/me/rank/weekly?weekStart=` | ✅ | Your weekly rank |
| GET | `/api/me/profile` | ✅ | Profile + stats |
| GET | `/api/battlepass` | ✅ | Battle Pass season + user progress |
| POST | `/api/battlepass/upgrade` | ✅ | Create Stripe checkout session |
| POST | `/api/battlepass/webhook` | — | Stripe webhook (no auth — signature verified) |

---

## Scoring

| Guesses | Score |
|---------|-------|
| 1 | 100 |
| 2 | 90 |
| 3 | 75 |
| 4 | 60 |
| 5 | 45 |
| 6 | 30 |
| Failed | 0 |

Leaderboard order: **score desc → solve time asc → finished_at asc**.

---

## Battle Pass

### Free Track (everyone)
- Starter Badge (Tier 1), Midnight Theme (3), Dedicated Title (5), Wordsmith Badge (8), Forest Theme (10), Veteran Title (13), Completionist Badge (15)

### Premium Track ($2.99 one-time)
- Gold Theme (1), Champion Border (2), Sparkle Effect (4), Neon Theme (6), Premium Badge (7), Confetti Effect (9), Crimson Theme (11), Elite Banner (12), Champion Title (14), Legend Badge (15)

### Earning XP
- Play daily puzzle: **+50 XP**
- Solve performance: +10–60 XP depending on guesses used
- Streak bonus: +5 XP/day (up to +50 XP)
- Each tier requires **100 XP**.

