import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [role, setRole] = useState('user')  // 'user' | 'admin'
  const [form, setForm] = useState({ username: '', email: '', password: '', adminSecret: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register, user } = useAuth()
  const navigate = useNavigate()

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const loggedInUser = await login(form.username, form.password)
        if (loggedInUser?.is_admin) navigate('/admin')
        else navigate('/dashboard')
      } else {
        const registeredUser = await register(form.username, form.email, form.password, role, form.adminSecret)
        if (registeredUser?.is_admin) navigate('/admin')
        else navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>⚡ HabitTracker</h1>
        <p>{mode === 'login' ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}</p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
          <button 
            type="button" 
            onClick={() => setRole('user')}
            style={{ flex: 1, padding: '8px', background: role === 'user' ? 'var(--accent)' : 'transparent', color: role === 'user' ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}
          >User</button>
          <button 
            type="button" 
            onClick={() => setRole('admin')}
            style={{ flex: 1, padding: '8px', background: role === 'admin' ? 'var(--accent)' : 'transparent', color: role === 'admin' ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}
          >Admin</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" name="username" value={form.username}
              placeholder="Enter username" onChange={handleChange} required />
          </div>
          {mode === 'register' && (
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={form.email}
                placeholder="Enter email" onChange={handleChange} required />
            </div>
          )}
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={form.password}
              placeholder="Enter password" onChange={handleChange} required />
          </div>
          {mode === 'register' && role === 'admin' && (
            <div className="form-group">
              <label>Admin Secret Code</label>
              <input type="password" name="adminSecret" value={form.adminSecret}
                placeholder="Enter secret to register as admin" onChange={handleChange} required />
            </div>
          )}
          {error && <p className="error-msg">⚠️ {error}</p>}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login'
            ? <>Don't have an account? <span onClick={() => setMode('register')}>Register</span></>
            : <>Already have an account? <span onClick={() => setMode('login')}>Sign In</span></>
          }
        </div>
      </div>
    </div>
  )
}
