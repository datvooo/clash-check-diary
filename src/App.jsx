import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'
import WeeklyReport from './pages/WeeklyReport.jsx'
import FreeClash from './pages/FreeClash.jsx'
import Layout from './components/Layout.jsx'

function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center text-gray-400">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index element={<Dashboard />} />
        <Route path="project/:id" element={<ProjectDetail />} />
        <Route path="weekly" element={<WeeklyReport />} />
        <Route path="free-clash" element={<FreeClash />} />
      </Route>
    </Routes>
  )
}
