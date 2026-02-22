# 🚀 PlanR (Workout PWA)

PlanR is a modern, high-performance Progressive Web App (PWA) designed to streamline your workout tracking and program management. Built with a focus on speed, aesthetics, and user experience, it allows you to manage your fitness journey seamlessly.

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF.svg?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?logo=tailwind-css)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28.svg?logo=firebase)

---

## ✨ Key Features

- **📊 Dashboard**: Real-time overview of your fitness progress and upcoming workouts.
- **🏋️ Program Management**: Create, edit, and organize multiple workout programs tailored to your goals.
- **⏱️ Active Workout Tracking**: Interactive workout overlay for real-time tracking of sets, reps, and rest periods.
- **📜 Workout History**: Comprehensive log of all past workouts to monitor your long-term progress.
- **📱 PWA Ready**: Installable on mobile and desktop for a native-like experience.
- **☁️ Cloud Sync**: Powered by Firebase for secure, real-time data synchronization across all your devices.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 7](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) (Animations)
- **State Management**: [Zustand](https://docs.pmnd.rs/zustand/)
- **Persistence**: Local Storage (Offline-first approach)
- **Utilities**: `date-fns`, `lucide-react`, `clsx`, `tailwind-merge`

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/PlanR.git
   cd PlanR
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

### Development

Run the development server:

```bash
npm run dev
```

### Build

Build the production-ready application:

```bash
npm run build
```

---

## 📁 Project Structure

```text
src/
├── components/     # Reusable UI components and layout
│   ├── ui/        # Atomic UI elements (Buttons, Inputs, etc.)
│   └── ...
├── pages/          # Main application views/routes
├── services/       # API and external service integrations (Firebase)
├── store/          # Zustand state management
├── hooks/          # Custom React hooks
├── lib/            # Configuration and utility libraries
├── types/          # TypeScript interface and type definitions
└── assets/         # Static assets (images, icons)
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by the PlanR Team.
