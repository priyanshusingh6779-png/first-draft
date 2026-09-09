import { useState, useEffect } from 'react'
import api from '../api/api'

export default function TodoList() {
  const [tasks, setTasks] = useState([])
  const [name, setName] = useState('')
  const [points, setPoints] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTasks = () => {
    api.get('/tasks').then(res => setTasks(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchTasks() }, [])

  const todayScore = tasks.filter(t => t.completed).reduce((s, t) => s + t.points, 0)

  const addTask = async () => {
    if (!name.trim() || points === '') return
    setError('')
    try {
      await api.post('/tasks', { name: name.trim(), points: Number(points) })
      setName(''); setPoints('')
      fetchTasks()
    } catch (e) {
      setError(e.response?.data?.detail || 'Error adding task')
    }
  }

  const toggleTask = async (id) => {
    await api.patch(`/tasks/${id}/complete`)
    fetchTasks()
  }

  const deleteTask = async (id) => {
    await api.delete(`/tasks/${id}`)
    fetchTasks()
  }

  return (
    <div className="page">
      <h1 className="page-title">To-Do List ✅</h1>
      <p className="page-subtitle">Track tasks and earn points daily</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Today's Score:</span>
        <span className={`score-badge ${todayScore < 0 ? 'negative' : ''}`}>{todayScore}</span>
      </div>

      <div className="input-row">
        <input type="text" placeholder="Task name" value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()} />
        <input type="number" placeholder="Points (e.g. +5 or -3)" value={points}
          onChange={e => setPoints(e.target.value)} style={{ maxWidth: '180px' }} />
        <button className="btn" onClick={addTask}>Add Task</button>
      </div>
      {error && <p className="error-msg" style={{ marginBottom: '1rem' }}>⚠️ {error}</p>}

      {loading ? (
        <div className="loading">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="empty">No tasks yet. Add one above! 🎯</div>
      ) : (
        tasks.map(t => (
          <div key={t.task_id} className={`list-item ${t.completed ? 'completed' : ''}`}>
            <input type="checkbox" checked={t.completed}
              onChange={() => toggleTask(t.task_id)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }} />
            <span className="name">{t.name}</span>
            <span className={`pts ${t.points < 0 ? 'neg' : ''}`}>
              {t.points > 0 ? '+' : ''}{t.points} pts
            </span>
            <button className="btn btn-sm btn-danger" onClick={() => deleteTask(t.task_id)}>✕</button>
          </div>
        ))
      )}
    </div>
  )
}
