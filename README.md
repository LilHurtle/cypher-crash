# Cipher Clash ⚔️

**Cipher Clash** is a daily competitive Wordle-like web game — guess the hidden word, race the clock, and compete on leaderboards.

---

## 🎮 Play Test It Right Now (1 command)

The fastest way to play with **zero account setup** — no Google login, no Supabase, no Stripe required.

### Option A — Docker (easiest, fully automated)

**Requirements:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

```bash
# 1. Clone the repo (if you haven't already)
git clone https://github.com/LilHurtle/cypher-crash.git
cd cypher-crash

# 2. Start everything (database + API + web)
docker compose up --build
```

Wait about 60–90 seconds for the first build. When you see:

```
web | VITE ready in ...ms
web |   ➜  Local: http://localhost:5173/
```

Open **http://localhost:5173** in your browser. You're automatically logged in as **Dev Player** — start typing to play!

To stop: `Ctrl+C`, then `docker compose down`.

> Your game progress is saved in a local PostgreSQL volume so it persists between restarts.

---

### Option B — Node + local PostgreSQL

**Requirements:** Node.js ≥ 18, pnpm ≥ 8, PostgreSQL running locally.

```bash
# 1. Install pnpm if you don't have it
npm install -g pnpm

# 2. Install dependencies
pnpm install

# 3. Set up API environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env and set:
#   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cypher_crash"
#   DEV_MODE="true"    ← this bypasses Google login
#   DAILY_SECRET="any-random-string"

# 4. Set up Web environment
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env and set:
#   VITE_DEV_MODE="true"    ← this auto-logs you in as Dev Player

# 5. Create the database and apply schema
pnpm --filter api db:push

# 6. Seed word lists + create the first Battle Pass season
pnpm --filter api seed

# 7. Start both servers
pnpm dev
```

Open **http://localhost:5173** — you're automatically logged in as **Dev Player**.

---

## What you can play-test

| Feature | Works in play-test? |
|---------|-------------------|
| Daily word puzzle (5–7 letters, 6 guesses) | ✅ |
| On-screen keyboard + physical keyboard | ✅ |
| Timer (starts on first keypress) | ✅ |
| Green / Yellow / Gray tile feedback | ✅ |
| Colorblind mode toggle | ✅ |
| Share result (copy to clipboard) | ✅ |
| Leaderboard (daily + weekly) | ✅ |
| Battle Pass — free track | ✅ |
| Battle Pass — premium upgrade ($2.99) | ✅ dev-mode instant upgrade (no card needed) |
| Profile + stats | ✅ |
| Google login | ❌ needs Supabase setup (see below) |

---

## Features

- 🎮 **Daily puzzle** — word length randomly 5, 6, or 7 letters (same for all players, set by HMAC)
- ⏱ **Server-side timer** — starts on first keypress, computed server-side to prevent cheating
- 🟩 **Accurate Wordle rules** — correct duplicate-letter evaluation
- 🏆 **Leaderboards** — daily and weekly, scored by points then solve time
- 🔐 **Google login** via Supabase Auth (for production)
- ⚔️ **Battle Pass** — free track + paid Premium track ($2.99 one-time via Stripe) with themes, badges, titles, effects and more
- 📱 **Mobile-first responsive UI** — touch keyboard, bottom nav, adaptive layouts
- 🎨 **Colorblind mode** — orange/blue tiles instead of green/yellow

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
├── docker-compose.yml
├── package.json      # Workspace root
└── pnpm-workspace.yaml
```

---

## Production Setup (Google login + real payments)

### Supabase (Google Auth)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **Authentication → Providers → Google** and enable it (needs a Google OAuth app from [Google Console](https://console.cloud.google.com)).
3. Add `https://your-domain.com` to **Redirect URLs** in Supabase Auth settings.
4. Copy your **Project URL** and **anon key** to `apps/web/.env`.
5. Copy your **JWT Secret** to `apps/api/.env` as `SUPABASE_JWT_SECRET`.
6. Set `DEV_MODE="false"` and `VITE_DEV_MODE="false"`.

### Stripe (Battle Pass payments)

1. Create a product in [Stripe Dashboard](https://dashboard.stripe.com) → Products → **Cipher Clash Premium Battle Pass**, price = **$2.99 one-time**.
2. Copy the **Price ID** (`price_...`) to `apps/api/.env` as `STRIPE_BATTLE_PASS_PRICE_ID`.
3. Copy your **Secret Key** to `STRIPE_SECRET_KEY`.
4. For webhooks: use [Stripe CLI](https://stripe.com/docs/stripe-cli): `stripe listen --forward-to localhost:3001/api/battlepass/webhook`.

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
| POST | `/api/battlepass/upgrade` | ✅ | Upgrade to premium ($2.99) |

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
Starter Badge → Midnight Theme → Dedicated Title → Wordsmith Badge → Forest Theme → Veteran Title → Completionist Badge

### Premium Track ($2.99 one-time)
Gold Theme → Champion Border → Sparkle Effect → Neon Theme → Premium Badge → Confetti Effect → Crimson Theme → Elite Banner → Champion Title → Legend Badge

### Earning XP
- Play daily puzzle: **+50 XP**
- Solve performance: +10–60 XP (fewer guesses = more XP)
- Streak bonus: **+5 XP/day** (up to +50 XP)
- Each tier requires **100 XP** · 15 tiers total
