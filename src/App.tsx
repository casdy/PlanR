import { AuthProvider } from './hooks/useAuth'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { History } from './pages/History'
import { ProgramManager } from './pages/ProgramManager'
import { ProgramDetail } from './pages/ProgramDetail'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/manage" element={<ProgramManager />} />
            <Route path="/program/:id" element={<ProgramDetail />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
