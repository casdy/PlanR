# 🚀 PlanR (Workout PWA)

PlanR is a modern, high-performance Progressive Web App (PWA) designed to streamline your workout tracking and program management. Built with a focus on speed, aesthetics, and user experience, it allows you to manage your fitness journey seamlessly.

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF.svg?logo=vite)
![Groq](https://img.shields.io/badge/Groq-Fast%20AI-F55036.svg)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E.svg?logo=supabase)

---

- **🎙️ Voice-Logged Workouts**: Hands-free logging using AI speech-to-text (Groq Whisper).
- **🤖 AI Routine Builder**: Generate custom workout programs instantly using the fast Groq LLM API.
- **🏆 Dynamic Achievements & Visuals**: Rich exercise visualizations using a hybrid of ExerciseDB GIFs and Noun Project SVGs.
- **📱 PWA Ready**: Installable on mobile and desktop for a native-like experience.
- **🔒 Local-First Database**: Powered by robust local-first SQLite-WASM storage with Supabase integration capabilities.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 7](https://vitejs.dev/)
- **Styling**: Tailwind CSS + Framer Motion (Animations)
- **AI Engine**: [Groq API](https://groq.com/) (Whisper large-v3, LLMs) for ultra-fast generation and transcription
- **Data APIs**: [ExerciseDB](https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb/) & [Noun Project](https://thenounproject.com/)
- **Persistence**: SQLite-WASM (Local) + [Supabase](https://supabase.com/)
- **Utilities**: `date-fns`, `lucide-react`, `zustand`

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

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add your API keys:

   ```env
   # Groq API for AI capabilities
   VITE_GROQ_API_KEY=your_groq_api_key

   # ExerciseDB API (via RapidAPI)
   VITE_RAPIDAPI_KEY=your_rapidapi_key

   # Noun Project API for SVGs
   VITE_NOUN_API_KEY=your_noun_key
   VITE_NOUN_API_SECRET=your_noun_secret

   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
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
├── components/     # Reusable UI components and overlays
├── pages/          # Main application views/routes
├── services/       # Groq AI, ExerciseDB, Noun Project, and DB services
├── store/          # Zustand state management
├── hooks/          # Custom React hooks
├── lib/            # Configuration and utility libraries (including SQLite Setup)
├── types/          # TypeScript interface and type definitions
└── assets/         # Static assets (images, icons)
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by the PlanR Team.
