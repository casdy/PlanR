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
import { LanguageProvider } from './hooks/useLanguage'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { History } from './pages/History'
import { ProgramDetail } from './pages/ProgramDetail'
import { Login } from './pages/Login'
import { SignUp } from './pages/SignUp'
import { SettingsPage } from './pages/Settings'
import { CalendarView } from './pages/CalendarView'
import { RecoveryCheckIn } from './pages/RecoveryCheckIn'
import { WebNutritionDashboard } from './pages/WebNutritionDashboard'
import MobileScannerPreview from './pages/mobile/MobileScannerPreview'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SplashScreen } from './components/SplashScreen'
import { OnboardingFlow } from './components/OnboardingFlow'
import { useUserStore } from './store/userStore'

// Inner app that can consume AuthContext
const AppRoutes = () => {
  const { loading, user } = useAuth();
  // Show splash while auth is initialising
  const [showSplash, setShowSplash] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!loading) {
      // If guest, exit splash much faster (1s total)
      // If registered, keep longer for data sync (4s total)
      const isGuest = user?.isGuest || !user;
      const exitDelay = isGuest ? 500 : 3500;
      const removeDelay = isGuest ? 1000 : 4000;

      const exitTimer = setTimeout(() => {
          setIsExiting(true);
      }, exitDelay);
      
      const removeTimer = setTimeout(() => {
          setShowSplash(false);
      }, removeDelay);
      
      return () => {
          clearTimeout(exitTimer);
          clearTimeout(removeTimer);
      };
    }
  }, [loading, user]);

  const { hasSeenOnboarding } = useUserStore();

  return (
    <>
      <SplashScreen show={showSplash && !isExiting} message="Initialising..." />
      
      {(!showSplash || isExiting) && (
        user && !hasSeenOnboarding ? (
          <OnboardingFlow />
        ) : (
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/nutrition-preview" element={<WebNutritionDashboard />} />
              <Route path="/mobile-scanner-preview" element={<MobileScannerPreview />} />

              {/* Redirects & Fallbacks */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/history" element={<History />} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/program/:id" element={<ProgramDetail />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/recovery" element={<RecoveryCheckIn />} />
                <Route path="/nutrition" element={<WebNutritionDashboard />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        )
      )}
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
