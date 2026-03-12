# 💪 PlanR — Intelligence-Driven Fitness Terminal

PlanR is a high-performance, privacy-first fitness companion designed for elite athletes and everyday enthusiasts. It merges **Google ML Kit Vision**, **On-Device Translation**, and an **Adaptive Workout Engine** into a stunning, glassmorphic "Intelligence Terminal" interface.

Built as a hybrid Capacitor/React solution, PlanR delivers a seamless, premium experience across Web, Android, and iOS.

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![Security](https://img.shields.io/badge/Security-NIST_CSF_2.0_Tier_3-red)
![Capacitor](https://img.shields.io/badge/Hybrid-Capacitor_8_Bridge-119EFF?logo=capacitor)

---

## 🔥 Elite Features

### 🍎 Vision-Based Nutrition
- **Native ML Kit Scanner**: Low-latency barcode detection for `EAN_13`, `EAN_8`, and `UPC_A`.
- **Open Food Facts Integration**: Seamless access to global food data with mandatory identity-header compliance.
- **On-Device Privacy**: Barcode processing happens locally; your dietary habits stay on your device.

### 🌍 Zero-Latency Translation
- **On-Device Inference**: Multilingual support powered by local Google ML Kit models.
- **Offline Reliability**: Full UI translation functionality without an internet connection.

### 🤖 Adaptive Performance Engine
- **AI Workout Architect**: Personalized routines generated via **Groq Llama 3 (70B)**.
- **Smart Fatigue Analysis**: Automatically adjusts volume and suggests deloads based on performance trends.
- **Calendar Orchestration**: Intelligent synchronization of workout splits with your native mobile calendar.

### 🛡️ Hardened Security Infrastructure
PlanR is designed for maximum privacy and resilience, adhering to **NIST CSF 2.0 (Tier 3)** guidelines.
- **API Gateways**: All third-party requests (Groq, Wger, ExerciseDB) are proxied via secure Vercel handlers with **IP-based Rate Limiting**.
- **Data Isolation**: Multi-layered protection using **Supabase Row Level Security (RLS)**.
- **Secure Headers**: Strict Content Security Policy (CSP), HSTS, and X-Frame-Options enforced at the edge.
- **Incident Response**: Formalized protocols documented in [Incident Response Playbook](docs/incident_response.md).

---

## 🛠️ Hybrid Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Core UI** | React 19 + TypeScript 5.9 + Vite 7 |
| **Mobile Bridge** | Capacitor 8 (Platform Native SDKs) |
| **Intelligence** | Google ML Kit (Vision & Translation) |
| **Processing** | Groq (Llama 3 70B & Whisper Large-v3) |
| **Backend** | Supabase (PostgreSQL RLS) + Vercel Edge |

---

## 🚀 Deployment

### 1. Web Development
```bash
npm install
npm run dev
```

### 2. Native Mobile
```bash
npm run build
npx cap sync
npx cap open android # or ios
```

---

*Built with ❤️ for the future of fitness.*
