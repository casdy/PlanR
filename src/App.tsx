/**
 * @file src/App.tsx
 * @description Root application component.
 *
 * Sets up the React Router tree, wraps everything in AuthProvider, and
 * shows a full-screen SplashScreen while authentication state is being
 * initialised. The splash lasts for ~2.5s after auth resolves so that
 * the transition into the app feels intentional rather than jarring.
 *
 * Route layout:
 *  - "/" → Dashboard
 *  - "/login" | "/signup" → Public auth pages
 *  - "/history" | "/manage" | "/calendar" | "/program/:id" | "/settings" → Protected (login required)
 */
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { History } from './pages/History'
import { ProgramManager } from './pages/ProgramManager'
import { ProgramDetail } from './pages/ProgramDetail'
import { Login } from './pages/Login'
import { SignUp } from './pages/SignUp'
import { SettingsPage } from './pages/Settings'
import { CalendarView } from './pages/CalendarView'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SplashScreen } from './components/SplashScreen'

// Inner app that can consume AuthContext
const AppRoutes = () => {
  const { loading } = useAuth();
  // Show splash while auth is initialising
  const [showSplash, setShowSplash] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Keep splash visible for a brief moment even after load finishes
      // Start exit animation slightly before fully removing it
      const exitTimer = setTimeout(() => {
          setIsExiting(true);
      }, 2000);
      
      const removeTimer = setTimeout(() => {
          setShowSplash(false);
      }, 2500); // 2000 + 500ms animation duration
      
      return () => {
          clearTimeout(exitTimer);
          clearTimeout(removeTimer);
      };
    }
  }, [loading]);

  return (
    <>
      <SplashScreen show={showSplash && !isExiting} message="Initialising..." />
      {(!showSplash || isExiting) && (
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/history" element={<History />} />
              <Route path="/manage" element={<ProgramManager />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/program/:id" element={<ProgramDetail />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Layout>
      )}
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
