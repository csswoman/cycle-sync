# 🌙 CycleSync: Holistic Health & Cycle Tracking

CycleSync is a premium, AI-powered health assistant designed for women's holistic wellness. It synchronizes nutrition, fitness, and mental health with the natural phases of the menstrual cycle, with specialized support for PCOS management. Built as an offline-first PWA with privacy-first principles.

![CycleSync Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

---

## ✨ Features

- **🧠 Smart AI Assistant** — Powered by Google Gemini with automatic model fallback (`2.5 Flash → 2.0 Flash → Flash Lite`). Supports multimodal analysis: meal photos for nutrition insights and exercise videos for form correction.
- **📊 Advanced Analytics** — Track mood, energy, and symptoms across cycles to identify hormonal patterns.
- **⚡ Personalized Dashboard** — Daily plans that adapt to your current cycle phase (Menstrual, Follicular, Ovulatory, Luteal).
- **🩺 PCOS Care** — Tailored symptom tracking (acne, fatigue, hirsutism, hair loss, bloating) with phase-specific advice.
- **🥗 Sync-Nourishment** — Phase-optimized meal ideas via Spoonacular with fallback recipes.
- **🏋️ Adaptive Routines** — Exercise recommendations based on a readiness score, with GIFs from ExerciseDB.
- **📰 Health Articles** — Curated health content via NewsAPI with static fallback.
- **📄 PDF Reports** — Export comprehensive health summaries for medical consultations.
- **⌚ Wearable Integration** — Fitbit OAuth and Samsung Health Connect webhook support.
- **🔒 Privacy First** — Offline-first with IndexedDB local persistence; data syncs to the cloud only when ready.

---

## 🚀 Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js](https://nextjs.org/) 16 (App Router) + [React](https://reactjs.org/) 19 |
| Language | [TypeScript](https://www.typescriptlang.org/) 5 |
| Styling | [Tailwind CSS](https://tailwindcss.com/) 3 + [next-themes](https://github.com/pacocoursey/next-themes) |
| State | [Zustand](https://zustand-demo.pmnd.rs/) (UI) + [Dexie](https://dexie.org/) (IndexedDB offline) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL + Auth + RLS) |
| AI | [Google Generative AI — Gemini](https://ai.google.dev/) |
| PWA | [Serwist](https://serwist.pages.dev/) (Service Worker) |
| PDF | [jsPDF](https://github.com/parallax/jsPDF) |
| Icons | [Google Material Symbols](https://fonts.google.com/icons) |
| Deploy | [Vercel](https://vercel.com/) |

---

## 🏗️ Architecture

The project follows a **feature-based, domain-driven** structure with clear separation of concerns:

```text
src/
├── app/
│   ├── (app)/              # Protected routes (require auth)
│   │   ├── dashboard/
│   │   ├── log/
│   │   ├── trends/
│   │   ├── habits/
│   │   ├── nutrition/
│   │   ├── routines/
│   │   ├── pcos/
│   │   ├── period-history/
│   │   ├── export/
│   │   └── settings/
│   ├── (auth)/             # Public auth routes (login, register, reset)
│   └── api/
│       ├── auth/fitbit/    # Fitbit OAuth flow
│       └── health/         # Samsung Health Connect webhook
├── features/               # Domain modules (UI + logic per feature)
├── hooks/                  # Business logic hooks (useCycleInfo, useGeminiAssistant…)
├── services/               # External API clients (Gemini, Fitbit, Spoonacular…)
├── stores/                 # Zustand global state
├── lib/supabase/           # Browser / server / admin Supabase clients
├── types/                  # Global TypeScript types
├── data/                   # Static fallback data (exercises, recipes)
└── i18n/                   # Translations (EN / ES)
```

### Key patterns

- **Feature-based modules** — each feature owns its components, hooks, and logic.
- **Custom hooks as the service boundary** — UI components never call APIs directly; hooks (`useHabits`, `useNutritionAI`, etc.) handle data fetching and mutations.
- **Service layer** — external APIs are isolated in `services/` so they can be swapped or mocked independently.
- **Offline-first** — writes go to Dexie (IndexedDB) first and sync to Supabase via `useOfflineSync` when online.
- **Route protection via middleware** — `middleware.ts` validates the Supabase session cookie and redirects unauthenticated users away from `/app/*`.

---

## 🗄️ Database Schema

All tables use **Row Level Security (RLS)** — users can only read and write their own data.

| Table | Purpose |
| --- | --- |
| `cycle_config` | Cycle length, last period, workout & dietary prefs, archetype |
| `daily_logs` | Mood, energy (1–10), sleep, symptoms — one row per user per day |
| `pcos_symptoms` | PCOS symptom severity (0–3) per day |
| `habits` | Habit definitions (water, sleep, mindfulness, custom) |
| `habit_logs` | Daily habit completion values |
| `fitbit_tokens` | OAuth access/refresh tokens for Fitbit |
| `health_data` | Steps, sleep, heart rate, calories from wearables |
| `health_webhook_tokens` | Secret tokens for the Health Connect Android webhook |

Migrations live in `supabase/migrations/`.

---

## 🔗 External Integrations

| Integration | Purpose | Quota |
| --- | --- | --- |
| Google Gemini 2.5 Flash | AI assistant + multimodal analysis | — |
| Fitbit Web API | Steps, heart rate, sleep (OAuth 2.0) | — |
| Samsung Health Connect | Android wearable webhook | — |
| Spoonacular | Recipe search & nutrition data | 150 req/day (free) |
| RapidAPI / ExerciseDB | Exercise library with GIFs | 10k req/month (free) |
| NewsAPI | Health articles | 100 req/day (free) |

All integrations have **graceful fallbacks** to static data when quotas are exceeded.

---

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A [Supabase](https://supabase.com/) project
- API keys for the integrations you want to enable

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your keys:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   # server-only, never expose to client

   # AI (server-only)
   GEMINI_API_KEY=your_gemini_key

   # Fitbit OAuth
   FITBIT_CLIENT_ID=your_fitbit_client_id
   FITBIT_CLIENT_SECRET=your_fitbit_client_secret
   NEXT_PUBLIC_FITBIT_CLIENT_ID=your_fitbit_client_id

   # Optional, server-only (the app has fallbacks without them)
   SPOONACULAR_API_KEY=your_spoonacular_key
   RAPIDAPI_KEY=your_rapidapi_key
   NEWSAPI_KEY=your_newsapi_key
   ```

   Third-party keys are read only by the API routes in `src/app/api/` (`/api/ai/*`, `/api/recipes/*`, `/api/exercises`, `/api/articles`), which require a logged-in user. They are never bundled into the browser.

3. Run the database migrations:
   ```bash
   npx supabase db push
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

---

## ⌚ Health Connect Webhook (Samsung / Galaxy Watch)

CycleSync receives steps, sleep, heart rate, distance, calories, and weight from **[HC Webhook](https://github.com/mcnaveen/health-connect-webhook)** on Android (data flow: Samsung Health → Health Connect → CycleSync).

1. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local` and Vercel (Supabase → **Settings** → **API** → `service_role`). This is required because the webhook endpoint bypasses browser cookies.
2. In the app: **Settings → Samsung & Health Connect → Generate webhook URL**, then paste that URL into the HC Webhook app on your phone.

The endpoint is `POST /api/health/webhook?token=<secret>`.

---

## 🌍 Internationalization

The app supports **English** and **Spanish** via the `src/i18n/` directory. Language is detected from browser preferences.

---

*Developed with love for holistic health and tech excellence.*
