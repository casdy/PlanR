# 💪 PlanR — Intelligence-Driven Fitness Terminal

PlanR is a high-performance, privacy-first fitness companion designed for elite athletes and everyday enthusiasts. It merges **OpenRouter AI**, **On-Device Translation**, and an **Adaptive Workout Engine** into a stunning, glassmorphic "Intelligence Terminal" interface.

Built as a hybrid Capacitor/React solution, PlanR delivers a seamless, premium experience across Web, Android, and iOS.

![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)
![AI Engine](https://img.shields.io/badge/AI-OpenRouter-teal?logo=openai)
![Security](https://img.shields.io/badge/Security-NIST_CSF_2.0_Tier_3-red)

---

## 🔥 Elite Features

### 🍎 Unified Vision Engine
- **Multimodal AI**: Leverages OpenRouter (Llama 3.2 Vision) to identify food, supplements, and barcodes directly from photos.
- **Fail-Safe Search**: Automatically falls back to AI vision if a barcode lookup in the Open Food Facts database fails.
- **Micro-Macro Analysis**: Instant extraction of Calories, Protein, Carbs, and Fats from raw meal images.

### 🧠 Adaptive Holistic Coaching
- **Neuro-Reporting**: Generates cached 7-day coaching plans based on your progress and biometrics.
- **Time-Aware Briefings**: Dynamically adapts the dashboard briefing (Morning, Afternoon, Evening) based on the user's local time.
- **Seamless Fallback**: The app maintains core functionality using local TypeScript engines if AI services are unavailable.
- **Smart Fatigue Analysis**: Automatically adjusts volume and suggests deloads based on recovery logs (Sleep, Soreness, Stress).

### ⚡ Quota & Resiliency
PlanR prioritizes system speed and cost-efficiency via a robust **AI Spark** quota system.
- **Network Resilience**: Uses a dual-stage quota tracker with `localStorage` fallback to suppress proxy errors during backend downtime.
- **Backend Tracking**: Vercel serverless functions track usage while ensuring a zero-latency frontend experience.

---

## 🛠️ Hybrid Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Core UI** | React 19 + TypeScript 5.9 + Vite 7 |
| **AI Engine** | OpenRouter (Free Tier Routing) |
| **Intelligence** | Google ML Kit (Vision & Translation) |
| **Processing** | Groq (Llama 3 70B & Whisper Large-v3) |
| **Backend** | Vercel Serverless (Node.js 22) + Supabase RLS |

---

## 🚀 Deployment

### 1. Environment Configuration
Create a `.env.local` file in the root directory:
```env
# AI API Keys
OPENROUTER_API_KEY=your_openrouter_key
GROQ_API_KEY=your_groq_key

# Database
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### 2. Run Locally
```bash
npm install
npm run dev
```

### 3. Native Mobile (Capacitor)
```bash
npm run build
npx cap sync
npx cap open android # or ios
```

---

*Built with ❤️ for the future of fitness.*
