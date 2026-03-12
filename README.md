# 💪 PlanR — Intelligence-Driven Fitness Terminal

PlanR is a high-performance, privacy-first fitness companion designed for everyone. It merges **Google ML Kit Vision**, **On-Device Translation**, and an **Adaptive Workout Engine** into a sleek, glassmorphic "Intelligence Terminal" interface.

Built as a hybrid Capacitor/React solution, PlanR delivers a seamless experience across Web, Android, and iOS.

![Version](https://img.shields.io/badge/version-1.5.0-blue.svg)
![ML Kit](https://img.shields.io/badge/Vision-Google_ML_Kit-4285F4?logo=google-cloud)
![Security](https://img.shields.io/badge/Security-NIST_CSF_2.0-red)
![Capacitor](https://img.shields.io/badge/Hybrid-Capacitor_7-119EFF?logo=capacitor)

---

## 🔥 Elite Features

### 🍎 Vision-Based Nutrition

- **Native ML Kit Scanner**: Instant barcode detection for `EAN_13`, `EAN_8`, and `UPC_A`.
- **Open Food Facts Bridge**: Direct integration with the world's largest open food database.
- **Privacy First**: All barcode processing happens 100% on-device.

### 🌍 Zero-Latency Translation

- **On-Device Inference**: Multilingual support (ES, FR, DE, etc.) powered locally by Google ML Kit.
- **Offline Ready**: No internet required for UI translation after initial model download.
- **Global Reach**: Seamless RTL (Right-to-Left) and LTR layout switching.

### 🤖 Adaptive Performance Engine

- **AI Workout Architect**: Generates custom programs using Groq Llama 3 (70B) based on your specific goals.
- **Engine Fallback**: A deterministic local generator ensures you always have a workout, even when offline.
- **Fatigue Analysis**: Automatically suggests **Deload Sessions** based on RPE and performance trends.

### 🎙️ Voice Logic

- **Whisper Integration**: Dictate your sets and reps. No more manual typing during heavy sessions.

---

## 🛠️ Hybrid Tech Stack

| Layer                  | Technology                                  |
| :--------------------- | :------------------------------------------ |
| **Core UI**            | React 19 + TypeScript 5.9 + Vite 7          |
| **Mobile Bridge**      | Capacitor 7 (Android / iOS)                 |
| **Vision/Translation** | Google ML Kit (Platform Native SDKs)        |
| **Styling**            | Vanilla CSS + Framer Motion (Glassmorphism) |
| **AI Processing**      | Groq (Llama 3 70B & Whisper Large-v3)       |
| **Database/Auth**      | Supabase (PostgreSQL with RLS + Auth)       |

---

## 🚀 Getting Started

### 1. Web Local Development

```bash
npm install
npm run dev
```

### 2. Native Mobile Setup

PlanR uses Capacitor to bridge web tech to native hardware.

```bash
# 1. Build the web assets
npm run build

# 2. Sync with Android/iOS
npx cap sync

# 3. Open in IDE
npx cap open android
npx cap open ios
```

---

## 📁 Project Architecture

- `src/engine/`: Core logic for fatigue detection and workout generation.
- `src/i18n/`: Central translation dictionaries and locale management.
- `src/services/`: Hybrid bridges for ML Kit, Groq, and Supabase.
- `src/components/nutrition/`: Native-optimized barcode scanner UI.
- `android/` & `ios/`: Native platform project folders.

---

## 📄 Privacy & Security

PlanR follows the **NIST CSF 2.0** framework. User data is protected via Supabase **Row Level Security (RLS)**. Intelligence features (Barcode Scanning & Translation) prioritize **On-Device Processing** to ensure your biometric and dietary data never leave your hardware.

Built with ❤️ by the PlanR Team.
