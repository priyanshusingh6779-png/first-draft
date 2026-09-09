import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import axios from 'axios'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card2)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '0.6rem 1rem', fontSize: '0.88rem', color: '#fff'
      }}>
        <strong>{label}</strong>: {payload[0].value} pts
      </div>
    )
  }
  return null
}

export default function SharedProgress() {
  const { username } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Note: This uses raw axios intentionally so it doesn't attach the JWT interceptor, enabling public access
    axios.get(`http://localhost:8000/api/public/progress/${username}`)
      .then(res => setData(res.data))
      .catch(err => {
        if (err.response?.status === 404) setError("User not found.")
        else setError("Failed to load progress.")
      })
      .finally(() => setLoading(false))
  }, [username])

  if (loading) return <div className="page"><div className="loading">Loading shared progress...</div></div>
  if (error) return <div className="page"><h2 style={{ textAlign: 'center', marginTop: '10vh' }}>{error}</h2></div>

  return (
    <div className="page">
      <h1 className="page-title" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        {username}'s Progress 🌟
      </h1>
      
      <div className="card" style={{ maxWidth: 600, margin: '2rem auto', textAlign: 'center' }}>
        <h3 style={{ margin: 0, color: 'var(--text-muted)' }}>Total Weekly Score</h3>
        <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent)', margin: '0.5rem 0' }}>
          {data?.weekly_progress?.total_weekly_score}
        </div>
        <p style={{ margin: 0 }}>{data?.insights?.message}</p>
      </div>

      <div className="chart-wrap" style={{ maxWidth: 800, margin: '0 auto' }}>
        <h2>Daily Score Breakdown</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data?.weekly_progress?.daily_breakdown} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#8a8fad', fontSize: 13 }} />
            <YAxis tick={{ fill: '#8a8fad', fontSize: 13 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" radius={[8, 8, 0, 0]}>
              {data?.weekly_progress?.daily_breakdown?.map((entry, i) => (
                <Cell key={i} fill={entry.score >= 0 ? '#7c6af7' : '#f76a6a'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Create your own Habit Tracker</a>
      </div>
    </div>
  )
}
