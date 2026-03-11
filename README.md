# 💪 PlanR — AI-Powered Workout Tracker

PlanR is a modern, offline-first Progressive Web App (PWA) for tracking workouts, building programs, and staying consistent. It combines AI-generated routines, voice-logged sets, and an adaptive performance engine into a polished, high-performance mobile-first experience. Now featuring a comprehensive nutrition intelligence suite and full multi-language support.

![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF.svg?logo=vite)
![Groq](https://img.shields.io/badge/Groq-AI-F55036.svg)
![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E.svg?logo=supabase)
![Wger](https://img.shields.io/badge/Data-Wger_API-blue.svg)

---

## ✨ Features

| Feature | Description |
| :--- | :--- |
| **🤖 AI Workout Architect** | Generate custom workout programs from a short goal description using Groq's Llama 3 70B. Features a 24-hour persistent prompt quota. |
| **🌍 Zero-Lag Language Engine** | Custom, zero-dependency translation system supporting English, Spanish, French, German, Portuguese, Arabic, and Chinese Mandarin. Includes full RTL (Right-to-Left) layout support. |
| **🍎 Nutrition Intelligence** | Integrated dashboard with Open Food Facts API lookup, macro-tracking, and intelligent "Morning Briefings" to optimize your fueling strategy. |
| **⚙️ PlanR Engine** | A high-performance fallback generator that builds robust workouts from your local exercise library when AI prompts are exhausted. |
| **📈 Adaptive Performance** | Detects fatigue patterns and high RPE sessions across 7 days to automatically suggest **Deload Adjustments** and active recovery. |
| **🎙️ Voice Logging** | Dictate your sets hands-free. Groq Whisper transcribes audio and extracts reps and weight automatically. |
| **🏋️ Wger Data Engine** | Powered by the global Wger exercise database for accurate exercise names, categories, and an active media-fetching system for high-quality instruction. |
| **🌙 Pro-UX Dark Mode** | Premium dark mode by default with lightning-fast theme toggling, animated splash screen, and a sleek language picker UI. |
| **🛡️ Security Hardened** | Fully audited codebase with zero hardcoded secrets, RLS-protected database migrations, and NIST CSF 2.0 alignment. |

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19 + TypeScript |
| **Build** | Vite 7 |
| **Styling** | Tailwind CSS 3 (Vanilla) + Framer Motion |
| **State** | Zustand 5 (with `persist` middleware) |
| **AI** | Groq SDK — Llama 3 70B (routines), Whisper large-v3 (voice) |
| **Database/Auth** | Supabase Auth + Postgres (RLS-hardened migrations) |
| **Exercise Data** | Wger REST API (Global Open Source Database) |
| **Food Data** | Open Food Facts API |
| **Localization** | Custom `useLanguage` Hook (7 Languages, Persistent) |
| **Performance** | Custom Adaptive Deload Engine (RPE & Recovery analysis) |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm v9+

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/your-username/PlanR.git
cd PlanR

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Then fill in your VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and GROQ_API_KEY.
```

### Local Development

```bash
# Start the Vite dev server
npm run dev
```

---

## 📁 Project Structure

```
src/
├── engine/                  # Adaptive Performance Engine (Deload detection)
├── i18n/                    # Central Translation Dictionary (Safe, typed strings)
├── hooks/
│   ├── useLanguage.tsx      # Multi-language context provider & persistence
│   ├── useAuth.tsx          # Supabase Auth orchestration
│   └── useTheme.tsx         # Dark/Light mode management
├── services/
│   ├── offService.ts        # Open Food Facts integration
│   ├── aiService.ts         # AI orchestration & Prompt Quota logic
│   └── wgerService.ts       # Unified Exercise Library
├── components/
│   ├── ui/LanguagePicker.tsx # Animated globe picker
│   ├── WebNutritionDashboard.tsx # Comprehensive fueling suite
│   └── SplashScreen.tsx     # Hardened Dark-mode loader
└── supabase/
    └── migrations/          # RLS-hardened SQL schema migrations
```

---

## 📄 Security

PlanR follows **NIST CSF 2.0** guidelines. All external API tokens are managed via `.env.local` and never committed. Database access is strictly enforced via **Row Level Security (RLS)** policies ensuring users can only access their personal workout and nutrition data.

---

Built with ❤️ by the PlanR Team.
