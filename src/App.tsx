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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/history" element={<History />} />
            <Route path="/manage" element={<ProgramManager />} />
            <Route path="/program/:id" element={<ProgramDetail />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
