import { useState, useEffect } from 'react'
import api from '../api/api'

export default function HabitStreak() {
  const [habits, setHabits] = useState([])
  const [name, setName] = useState('')
  const [points, setPoints] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchHabits = () => {
    api.get('/habits').then(res => setHabits(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchHabits() }, [])

  const addHabit = async () => {
    if (!name.trim() || points === '') return
    setError('')
    try {
      await api.post('/habits', { name: name.trim(), points: Number(points) })
      setName(''); setPoints('')
      fetchHabits()
    } catch (e) {
      setError(e.response?.data?.detail || 'Error adding habit')
    }
  }

  const completeHabit = async (id) => {
    try {
      await api.post(`/habits/${id}/complete`)
      fetchHabits()
    } catch (e) {
      alert(e.response?.data?.detail || 'Error')
    }
  }

  const deleteHabit = async (id) => {
    await api.delete(`/habits/${id}`)
    fetchHabits()
  }

  const maxStreak = habits.reduce((m, h) => Math.max(m, h.current_streak), 0)

  return (
    <div className="page">
      <h1 className="page-title">Habit Streak 🔥</h1>
      <p className="page-subtitle">Build consistency, maintain streaks</p>

      <div style={{ display: 'flex', gap: '1.2rem', marginBottom: '1.8rem', flexWrap: 'wrap' }}>
        <div className="card" style={{ textAlign: 'center', minWidth: 140 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Best Streak</div>
          <div className="streak-num">{maxStreak}🔥</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>days</div>
        </div>
        <div className="card" style={{ textAlign: 'center', minWidth: 140 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>Active Habits</div>
          <div className="streak-num" style={{ fontSize: '2.5rem' }}>{habits.length}</div>
        </div>
      </div>

      <div className="input-row">
        <input type="text" placeholder="Habit name (e.g. Drink water)" value={name}
          onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHabit()} />
        <input type="number" placeholder="Points" value={points}
          onChange={e => setPoints(e.target.value)} style={{ maxWidth: 140 }} />
        <button className="btn" onClick={addHabit}>Add Habit</button>
      </div>
      {error && <p className="error-msg" style={{ marginBottom: '1rem' }}>⚠️ {error}</p>}

      {loading ? (
        <div className="loading">Loading habits...</div>
      ) : habits.length === 0 ? (
        <div className="empty">No habits yet. Add one above! 🎯</div>
      ) : (
        habits.map(h => (
          <div key={h.habit_id} className="list-item">
            <span style={{ fontSize: '1.2rem' }}>🔥</span>
            <span className="name">
              {h.name}
              <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                streak: {h.current_streak} | best: {h.longest_streak}
              </span>
            </span>
            <span className={`pts ${h.points < 0 ? 'neg' : ''}`}>
              {h.points > 0 ? '+' : ''}{h.points} pts
            </span>
            <button className="btn btn-sm" onClick={() => completeHabit(h.habit_id)}>Done ✓</button>
            <button className="btn btn-sm btn-danger" onClick={() => deleteHabit(h.habit_id)}>✕</button>
          </div>
        ))
      )}
    </div>
  )
}
