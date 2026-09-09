import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import api from '../api/api'
import { useAuth } from '../context/AuthContext'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-card2)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '0.6rem 1rem', fontSize: '0.88rem'
      }}>
        <strong>{label}</strong>: {payload[0].value} pts
      </div>
    )
  }
  return null
}

export default function WeeklyProgress() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.get('/progress/weekly')
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page"><div className="loading">Loading progress...</div></div>

  const handleCopyLink = () => {
    let baseUrl = `${window.location.protocol}//${window.location.host}`
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      baseUrl = 'https://priyanshus-habit-tracker.loca.lt'
    }

    const url = `${baseUrl}/shared/${user.username}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.2rem' }}>Weekly Progress 📊</h1>
          <p className="page-subtitle">Your performance over the last 7 days</p>
        </div>
        <button 
          onClick={handleCopyLink}
          style={{ 
            background: copied ? '#4CAF50' : 'var(--bg-card2)', 
            border: `1px solid ${copied ? '#4CAF50' : 'var(--accent)'}`, 
            color: '#fff', padding: '0.6rem 1.2rem', borderRadius: 8, cursor: 'pointer',
            transition: 'all 0.2s', fontWeight: 600, fontSize: '0.9rem'
          }}
        >
          {copied ? '✅ Link Copied!' : '🔗 Share Public Link'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1.2rem', marginBottom: '1.5rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', minWidth: 160 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>Total Weekly Score</div>
          <div className={`score-badge ${data?.total_weekly_score < 0 ? 'negative' : ''}`} style={{ fontSize: '1.8rem', padding: '0.4rem 1.5rem' }}>
            {data?.total_weekly_score ?? 0}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', minWidth: 160 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 6 }}>Best Day</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent3)' }}>
            {data?.daily_breakdown?.reduce((best, d) => d.score > best.score ? d : best, { score: -Infinity, date: '-' })?.date}
          </div>
        </div>
      </div>

      <div className="chart-wrap">
        <h2>Daily Score Breakdown</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data?.daily_breakdown} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#8a8fad', fontSize: 13 }} />
            <YAxis tick={{ fill: '#8a8fad', fontSize: 13 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" radius={[8, 8, 0, 0]}>
              {data?.daily_breakdown?.map((entry, i) => (
                <Cell key={i} fill={entry.score >= 0 ? '#7c6af7' : '#f76a6a'} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
