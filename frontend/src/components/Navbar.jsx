import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <nav className="navbar">
      <a href="/dashboard" className="brand">⚡ HabitTracker</a>
      <NavLink to="/dashboard" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Dashboard</NavLink>
      <NavLink to="/habits"   className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Habits</NavLink>
      <NavLink to="/todo"     className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Tasks</NavLink>
      <NavLink to="/progress" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Progress</NavLink>
      <NavLink to="/insights" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Insights</NavLink>
      {user.is_admin && <NavLink to="/admin" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} style={{color: 'var(--accent)'}}>Admin Panel</NavLink>}
      <button className="nav-logout" onClick={handleLogout}>Logout</button>
    </nav>
  )
}
