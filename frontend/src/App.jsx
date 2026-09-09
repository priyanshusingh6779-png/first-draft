import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TodoList from './pages/TodoList'
import HabitStreak from './pages/HabitStreak'
import WeeklyProgress from './pages/WeeklyProgress'
import Insights from './pages/Insights'
import AdminDashboard from './pages/AdminDashboard'
import SharedProgress from './pages/SharedProgress'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading" style={{ paddingTop: '30vh' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !user.is_admin) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/todo"      element={<ProtectedRoute><TodoList /></ProtectedRoute>} />
        <Route path="/habits"    element={<ProtectedRoute><HabitStreak /></ProtectedRoute>} />
        <Route path="/progress"  element={<ProtectedRoute><WeeklyProgress /></ProtectedRoute>} />
        <Route path="/insights"  element={<ProtectedRoute><Insights /></ProtectedRoute>} />
        <Route path="/admin"     element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/shared/:username" element={<SharedProgress />} />
        <Route path="*"          element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
