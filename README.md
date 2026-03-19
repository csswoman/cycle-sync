# 🌙 CycleSync: Holistic Health & Cycle Tracking

CycleSync is a premium, AI-powered health assistant designed specifically for women's holistic wellness. It synchronizes nutrition, fitness, and mental health with the natural phases of the menstrual cycle, with specialized support for PCOS management.

![CycleSync Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## ✨ key Features

- **🧠 Smart AI Assistant**: Powered by Google Gemini with a custom fallback system across multiple models (`Gemini 2.5 Flash`, `2.0 Flash`, `Lite`).
  - **Multimodal capabilities**: Analyze meal photos for nutrition insight and exercise videos for form correction.
- **📊 Advanced Analytics**: Track mood, energy, and symptoms across cycles to identify hormonal patterns.
- **⚡ Personalized Dashboards**: Daily plans that adapt to your current cycle phase (Menstrual, Follicular, Ovulatory, Luteal).
- **🧘 Specialized Toolkits**:
  - **PCOS Care**: Tailored advice for insulin sensitivity and hormonal balance.
  - **Sync-Nourishment**: Meal ideas optimized for each phase.
  - **Adaptive Routines**: Exercise recommendations based on your readiness score.
- **🔒 Privacy First**: Designed with local data persistence in mind, ensuring your health data stays on your device.

## 🏗️ Architecture & Best Practices

The project follows a modern, scalable architecture based on **SOLID principles**:

- **Feature-Based Structure**: Organized by domain functionality (Cycle, Health, Assistant) rather than technical layers.
- **Custom Hooks & Services**: Business logic and API interactions (like Gemini) are decoupled from UI components using the Dependency Inversion principle.
- **Atomic UI Components**: Reusable, consistent components (Buttons, Cards, Badges) built with a custom design system.
- **TypeScript First**: Full type safety across the entire application.

## 🚀 Tech Stack

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **AI Engine**: [Google Generative AI (Gemini)](https://ai.google.dev/)
- **Styling**: Vanilla CSS with modern Glassmorphism and vibrant aesthetics.
- **Icons**: [Google Material Symbols](https://fonts.google.com/icons)

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory and add your Gemini API Key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## ⌚ Health Connect webhook (Samsung / Galaxy Watch)

CycleSync can receive steps, sleep, heart rate, distance, calories, and weight from **[HC Webhook](https://github.com/mcnaveen/health-connect-webhook)** on Android (data flows: Samsung Health → Health Connect → your app).

1. Run the SQL migration `supabase/migrations/20260320000000_health_webhook_tokens.sql` (or `npx supabase db push`).
2. Add **`SUPABASE_SERVICE_ROLE_KEY`** to `.env.local` and Vercel (Supabase → **Settings** → **API** → `service_role` — **server only**, never in client code).
3. In the app: **Settings** → **Samsung & Health Connect** → **Generate webhook URL**, then paste that full URL into HC Webhook on your phone.

The webhook endpoint is `POST /api/health/webhook?token=...` and does **not** use browser cookies, so the service role key is required to write to `health_data`.

## 📂 Project Structure

```text
src/
├── components/         # Reusable structural and UI elements
├── features/           # Domain-driven features (Dashboard, Cycle, etc.)
├── hooks/              # Reusable business logic/custom hooks
├── services/           # External API clients
├── types/              # Global TypeScript interfaces
└── assets/             # Global styles and static files
```

---
*Developed with love for holistic health and tech excellence.*
