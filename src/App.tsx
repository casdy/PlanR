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
import { App as CapacitorApp } from '@capacitor/app'
import { supabase } from './lib/supabase'
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

import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SplashScreen } from './components/SplashScreen'
import { OnboardingFlow } from './components/OnboardingFlow'
import { useUserStore } from './store/userStore'
import { NotificationService } from './services/notificationService'

// Inner app that can consume AuthContext
const AppRoutes = () => {
  const { loading, user } = useAuth();
  // Show splash while auth is initialising
  const [showSplash, setShowSplash] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Handle deep links for mobile OAuth
    const setupDeepLink = async () => {
      CapacitorApp.addListener('appUrlOpen', async (data) => {
        console.log('[App] App opened with URL:', data.url);
        
        // Use a relative-safe parsing for the URL hash/query
        const url = new URL(data.url);
        const hash = url.hash;

        if (hash && (hash.includes('access_token=') || hash.includes('refresh_token='))) {
          console.log('[App] Detected OAuth tokens in deep link. Syncing with Supabase...');
          
          const params = new URLSearchParams(hash.substring(1));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
             const { error } = await supabase.auth.setSession({
                 access_token,
                 refresh_token
             });
             if (error) console.error('[App] Failed to set session from deep link:', error);
             else console.log('[App] Session established from deep link!');
          }
        }
      });
    };

    setupDeepLink();
  }, []);

  useEffect(() => {
    // Initialise Notifications
    NotificationService.requestPermissions();
    NotificationService.clearTodaysPrompts();
  }, []);

  useEffect(() => {
    console.log('[App] Loading state:', loading, 'User:', user?.id || 'none');
    if (!loading) {
      const isGuest = user?.isGuest || !user;
      const exitDelay = isGuest ? 500 : 3500;
      const removeDelay = isGuest ? 1000 : 4000;

      console.log(`[App] Auth loaded. Scheduling splash exit in ${exitDelay}ms and removal in ${removeDelay}ms`);

      const exitTimer = setTimeout(() => {
          console.log('[App] Splash exiting (isExiting = true)');
          setIsExiting(true);
      }, exitDelay);
      
      const removeTimer = setTimeout(() => {
          console.log('[App] Splash removed (showSplash = false)');
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
