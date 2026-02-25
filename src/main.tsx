/**
 * @file src/main.tsx
 * @description Application entry point.
 *
 * Mounts the root React component tree into the DOM element `#root`.
 * Wraps the app in React's StrictMode to surface potential issues
 * during development (double-invokes lifecycle methods etc.)
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
