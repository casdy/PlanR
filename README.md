# 🚀 PlanR (Workout PWA)

PlanR is a modern, high-performance Progressive Web App (PWA) designed to streamline your workout tracking and program management. Built with a focus on speed, aesthetics, and user experience, it allows you to manage your fitness journey seamlessly.

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF.svg?logo=vite)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?logo=tailwind-css)
![Hugging Face](https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-Inference-FFD21E.svg)

---

- **🎙️ Voice-Logged Workouts**: Hands-free logging using AI speech-to-text (Whisper).
- **🤖 AI Routine Builder**: Generate custom workout programs instantly based on your goals.
- **🏆 Dynamic Achievements**: Unique, AI-generated badges (FLUX) to celebrate your fitness milestones.
- **📱 PWA Ready**: Installable on mobile and desktop for a native-like experience.
- **🔒 Private by Design**: Offline-first storage with secure, local-only data persistence.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 7](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) (Animations)
- **AI Engine**: [Hugging Face Inference](https://huggingface.co/inference) (Whisper, FLUX, LLMs)
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

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add your Hugging Face API token:
   ```env
   HF_API_TOKEN=your_token_here
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
├── services/       # AI (Hugging Face) and Local persistence
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
