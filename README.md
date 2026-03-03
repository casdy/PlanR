# 💪 PlanR — AI-Powered Workout Tracker

PlanR is a modern, offline-first Progressive Web App (PWA) for tracking workouts, building programs, and staying consistent. It combines AI-generated routines, voice-logged sets, and an adaptive performance engine into a polished, high-performance mobile-first experience.

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF.svg?logo=vite)
![Groq](https://img.shields.io/badge/Groq-AI-F55036.svg)
![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E.svg?logo=supabase)
![Wger](https://img.shields.io/badge/Data-Wger_API-blue.svg)

---

## ✨ Features

| Feature                     | Description                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **🤖 AI Workout Architect** | Generate custom workout programs from a short goal description using Groq's Llama 3 70B. Features a 24-hour persistent prompt quota. |
| **⚙️ PlanR Engine**         | A high-performance fallback generator that builds robust workouts from your local exercise library when AI prompts are exhausted.    |
| **📈 Adaptive Performance** | Detects fatigue patterns and high RPE sessions across 7 days to automatically suggest **Deload Adjustments** and active recovery.    |
| **🎙️ Voice Logging**        | Dictate your sets hands-free. Groq Whisper transcribes audio and extracts reps and weight automatically.                             |
| **🏋️ Wger Data Engine**     | Powered by the global Wger exercise database for accurate exercise names, categories, and high-quality instructional media.          |
| **🌙 Pro-UX Dark Mode**     | Premium dark mode by default with a lightning-fast theme toggle and animated splash screen branding.                                 |
| **📊 Activity Feed**        | Chronological workout history with color-coded status badges: ✅ Completed, ⏸️ Paused, 🧪 Progressive.                               |
| **🛡️ Security Hardened**    | Fully audited codebase with zero hardcoded secrets, proxy-obscured API calls, and hardened `.gitignore` policies.                    |

---

## 🛠️ Tech Stack

| Layer             | Technology                                                  |
| ----------------- | ----------------------------------------------------------- |
| **Frontend**      | React 19 + TypeScript                                       |
| **Build**         | Vite 7                                                      |
| **Styling**       | Tailwind CSS 3 (Vanilla) + Framer Motion                    |
| **State**         | Zustand 5 (with `persist` middleware)                       |
| **AI**            | Groq SDK — Llama 3 70B (routines), Whisper large-v3 (voice) |
| **Exercise Data** | Wger REST API (Global Open Source Database)                 |
| **Auth**          | Supabase Auth + SQLite Local Fallback                       |
| **Performance**   | Custom Adaptive Deload Engine (RPE & Recovery analysis)     |
| **Icons**         | Lucide React                                                |

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
# Then fill in your API keys (VITE_WGER_API_KEY, GROQ_API_KEY, etc.)
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
├── engine/                  # Adaptive Performance Engine (Deload detection & adjustments)
├── services/
│   ├── aiService.ts         # AI orchestration & Prompt Quota logic
│   ├── wgerService.ts       # Unified Exercise Library (replaces ExerciseDB)
│   ├── quotaService.ts      # 24h persistent prompt tracker (localStorage)
│   └── groqService.ts       # Groq SDK wrapper for Llama 3 and Whisper
├── components/
│   ├── RoutineGenerator.tsx # AI/PlanR Engine generator UI
│   ├── SplashScreen.tsx     # Hardened Dark-mode loader
│   └── Layout.tsx           # Snappy Navigation shell
├── types/                   # Central TS interfaces
└── pages/                   # Main View controllers (Dashboard, Programs, History)
```

---

## 📄 Security

PlanR follows **NIST CSF 2.0** guidelines. All external API tokens are managed via `.env.local` and never committed to version control. Client-side requests are proxied via `vite.config.ts` to prevent origin leakage.

---

Built with ❤️ by the PlanR Team.
