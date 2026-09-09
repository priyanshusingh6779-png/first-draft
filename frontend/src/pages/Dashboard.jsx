import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/api'
import { useState, useEffect } from 'react'

export default function Dashboard() {
  const { user } = useAuth()
  const [weeklyScore, setWeeklyScore] = useState(null)

  useEffect(() => {
    api.get('/progress/weekly')
      .then(res => setWeeklyScore(res.data.total_weekly_score))
      .catch(() => {})
  }, [])

  const cards = [
    { to: '/todo',     icon: '✅', title: 'To-Do List',    desc: 'Plan and complete daily tasks' },
    { to: '/habits',   icon: '🔥', title: 'Habit Streak',  desc: 'Track your daily consistency' },
    { to: '/progress', icon: '📊', title: 'Weekly Progress', desc: 'Analyze your performance' },
    { to: '/insights', icon: '💡', title: 'Insights',      desc: 'View productivity patterns' },
  ]

  return (
    <div className="page">
      <h1 className="page-title">Welcome back, {user?.username}! 👋</h1>
      <p className="page-subtitle">Your consistency defines you.</p>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
        <div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Weekly Score</div>
          <div className={`score-badge ${weeklyScore < 0 ? 'negative' : ''}`}>
            {weeklyScore === null ? '...' : weeklyScore}
          </div>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {weeklyScore > 50 ? '🔥 Crushing it this week!' : weeklyScore > 0 ? '📈 Keep going!' : '💪 You can do it!'}
        </div>
      </div>

      <div className="dash-grid">
        {cards.map(c => (
          <Link key={c.to} to={c.to} className="dash-card">
            <div className="icon">{c.icon}</div>
            <h3>{c.title}</h3>
            <p>{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
