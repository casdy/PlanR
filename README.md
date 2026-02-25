# 💪 PlanR — AI-Powered Workout Tracker

PlanR is a modern, offline-first Progressive Web App (PWA) for tracking workouts, building programs, and staying consistent. It combines AI-generated routines, voice-logged sets, and an animated activity feed into a polished mobile-first experience.

![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF.svg?logo=vite)
![Groq](https://img.shields.io/badge/Groq-AI-F55036.svg)
![Supabase](https://img.shields.io/badge/Supabase-Auth-3ECF8E.svg?logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4.svg?logo=tailwindcss)

---

## ✨ Features

| Feature                      | Description                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **🤖 AI Routine Builder**    | Generate full 3-day programs from a short goal description using Groq's Llama 3 70B. Automatically falls back to ExerciseDB when AI quota is exhausted. |
| **🎙️ Voice Logging**         | Dictate your sets hands-free. Groq Whisper transcribes audio and extracts reps and weight automatically.                                                |
| **⏸️ Multi-Session Pausing** | Pause a workout and start another — all paused sessions are saved independently in the Activity Feed and resumable at any time.                         |
| **📅 Calendar Planning**     | Schedule workouts on specific dates. The Dashboard highlights today's planned session for a one-tap start.                                              |
| **📊 Activity Feed**         | Full chronological workout history with colour-coded badges: ✅ Completed, ⏸️ Paused, ❌ Incomplete.                                                    |
| **🔄 Exercise Swapper**      | Replace any exercise in a saved program with alternatives from the same muscle group, powered by ExerciseDB.                                            |
| **🏆 Achievement Badges**    | Dynamic procedural SVG achievement badges are generated after every completed workout.                                                                  |
| **📱 PWA Ready**             | Installable on mobile and desktop for a native-like experience. Fully offline-capable data layer.                                                       |
| **🔒 Local-First Storage**   | All workout data is stored in `localStorage` — nothing is lost on refresh. Supabase is used for authentication only.                                    |
| **🌙 Dark / Light Mode**     | System-aware theme with a manual toggle, persisted across sessions.                                                                                     |

---

## 🛠️ Tech Stack

| Layer             | Technology                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------- |
| **Frontend**      | React 19 + TypeScript                                                                        |
| **Build**         | Vite 7                                                                                       |
| **Styling**       | Tailwind CSS 3 + Framer Motion                                                               |
| **State**         | Zustand 5 (with `persist` middleware)                                                        |
| **AI**            | Groq SDK — Llama 3 70B (routines), Llama 3 8B (transcript parsing), Whisper large-v3 (voice) |
| **Exercise Data** | ExerciseDB via RapidAPI                                                                      |
| **Auth**          | Supabase Auth (email/password + Google OAuth)                                                |
| **Persistence**   | localStorage (offline-first) + Supabase (auth only)                                          |
| **Routing**       | React Router DOM 7                                                                           |
| **Icons**         | Lucide React                                                                                 |
| **Utilities**     | `date-fns`, `clsx`, `tailwind-merge`, `bcryptjs`                                             |

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
# Then fill in your API keys (see Environment Variables below)
```

### Local Development

To run the app locally with full backend functionality (including AI routine generation and ExerciseDB proxying):

1. **Install Vercel CLI (Optional but recommended)**:

   ```bash
   npm i -g vercel
   ```

2. **Run Vercel Dev**:
   ```bash
   npx vercel dev
   ```
   _This will run both the Vite frontend and the Serverless Functions at the same time._

Alternatively, strictly for UI-only work, you can still use:

```bash
npm run dev
```

_(Note: API-dependent features like AI generation will 404 in standard Vite dev unless you use the Vercel CLI)._

### Available Scripts

| Command           | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server on `http://localhost:5173` |
| `npm run build`   | Type-check + production bundle to `/dist`            |
| `npm run preview` | Serve the production build locally                   |
| `npm run lint`    | Run ESLint                                           |

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root (`.env.example` has the template):

```env
# Supabase — required for user auth
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Groq — required for AI routine generation and voice transcription
VITE_GROQ_API_KEY=gsk_...

# ExerciseDB via RapidAPI — required for exercise suggestions and swap feature
VITE_RAPIDAPI_KEY=your_rapidapi_key_here
```

> [!NOTE]
> The app works in "Guest Mode" without auth. AI features are disabled if `VITE_GROQ_API_KEY` is missing but the rest of the app remains fully functional with the built-in default programs.

---

## 📁 Project Structure

```
src/
├── App.tsx                  # Root router, AuthProvider, splash screen logic
├── main.tsx                 # React DOM entry point
│
├── types/
│   └── index.ts             # Shared TypeScript interfaces (User, WorkoutProgram, WorkoutLog…)
│
├── lib/
│   ├── supabase.ts          # Supabase client singleton
│   └── utils.ts             # cn() class name utility
│
├── hooks/
│   ├── useAuth.tsx          # Auth context + provider (login, signup, guest, Google OAuth)
│   ├── useTheme.tsx         # Dark/light theme toggle with localStorage persistence
│   └── useVoiceRecorder.ts  # Web MediaRecorder hook for voice logging
│
├── store/
│   ├── workoutStore.ts      # Active session state machine (start → running → paused → finished)
│   ├── calendarStore.ts     # Planned workout calendar (persisted to localStorage)
│   └── toastStore.ts        # Global toast notification queue
│
├── services/
│   ├── localService.ts      # Offline-first localStorage CRUD for programs and logs
│   ├── programService.ts    # Default program templates + program CRUD wrapper
│   ├── aiService.ts         # AI orchestration: Groq primary → ExerciseDB fallback
│   ├── groqService.ts       # Groq SDK wrapper (streaming LLM + Whisper transcription)
│   ├── exerciseDBService.ts # ExerciseDB API client (exercises by body part / target)
│   ├── sqliteAuthService.ts # Supabase auth wrapper (register, login, Google OAuth)
│   ├── quotaService.ts      # Per-session Groq usage cap (sessionStorage)
│   └── thumbnailService.ts  # Deterministic SVG generator for exercise thumbnails & badges
│
├── components/
│   ├── Layout.tsx               # App shell: top header + bottom tab nav
│   ├── SplashScreen.tsx         # Animated full-screen loading overlay
│   ├── ProtectedRoute.tsx       # Route guard (redirects unauthenticated users to /login)
│   ├── ActiveWorkoutOverlay.tsx  # Live workout floating UI (minimised pill + expanded panel)
│   ├── WorkoutSummary.tsx       # Post-workout achievement modal
│   ├── WorkoutDayView.tsx       # Exercise list for a single program day
│   ├── ProgramEditor.tsx        # Exercise swap editor (ExerciseDB powered)
│   ├── RoutineGenerator.tsx     # AI routine generator widget with streaming preview
│   ├── ExerciseCard.tsx         # Exercise suggestion card (Dashboard "Today's Focus")
│   ├── ExerciseImage.tsx        # Smart GIF loader with spinner + dumbbell fallback
│   ├── DailyWorkoutModal.tsx    # Calendar bottom-sheet for scheduling/starting workouts
│   └── ErrorBoundary.tsx        # React error boundary with friendly fallback UI
│
├── pages/
│   ├── Dashboard.tsx        # Home tab — today's workout, streak, focus suggestions
│   ├── History.tsx          # Activity Feed — completed, paused, and incomplete logs
│   ├── ProgramManager.tsx   # Programs library + AI generator entry point
│   ├── ProgramDetail.tsx    # Single program full schedule view with Start/Edit/Delete
│   ├── CalendarView.tsx     # Monthly calendar for planning workouts
│   ├── Settings.tsx         # App preferences, theme, data export, danger zone
│   ├── Login.tsx            # Email/password + Google OAuth login
│   └── SignUp.tsx           # New user registration
│
└── assets/                  # Static assets (app icon, images)
```

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Built with ❤️ using React, Groq, and ExerciseDB.
