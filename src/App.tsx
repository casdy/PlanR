import { AuthProvider } from './hooks/useAuth'
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

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
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
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
