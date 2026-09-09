import { useState, useEffect } from 'react'
import api from '../api/api'

export default function Insights() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recs, setRecs] = useState([])
  const [recsLoading, setRecsLoading] = useState(true)
  const [recsError, setRecsError] = useState('')

  useEffect(() => {
    api.get('/insights')
      .then(res => setData(res.data))
      .finally(() => setLoading(false))

    api.get('/insights/recommendations')
      .then(res => setRecs(res.data.recommendations || []))
      .catch(err => {
        const msg = err.response?.data?.detail || 'Could not load AI recommendations.'
        setRecsError(msg)
      })
      .finally(() => setRecsLoading(false))
  }, [])

  if (loading) return <div className="page"><div className="loading">Analyzing your week...</div></div>

  return (
    <div className="page">
      <h1 className="page-title">Insights 💡</h1>
      <p className="page-subtitle">Your productivity patterns this week</p>

      {/* Score Card */}
      <div className={`insight-card ${data?.level}`}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 8 }}>7-Day Score</div>
        <div className="score">
          {data?.score > 0 ? '+' : ''}{data?.score}
        </div>
        <div className="msg">{data?.message}</div>

        <div style={{
          marginTop: '2rem', display: 'flex', justifyContent: 'center',
          gap: '0.5rem', flexWrap: 'wrap'
        }}>
          {data?.level === 'great' && (
            <>
              <span style={{ background: 'rgba(106,247,196,0.15)', border: '1px solid var(--accent3)', borderRadius: 999, padding: '0.3rem 0.9rem', fontSize: '0.8rem', color: 'var(--accent3)' }}>🏆 Champion</span>
              <span style={{ background: 'rgba(124,106,247,0.15)', border: '1px solid var(--accent)', borderRadius: 999, padding: '0.3rem 0.9rem', fontSize: '0.8rem', color: 'var(--accent)' }}>⚡ Consistent</span>
            </>
          )}
          {data?.level === 'moderate' && (
            <span style={{ background: 'rgba(255,217,61,0.15)', border: '1px solid #ffd93d', borderRadius: 999, padding: '0.3rem 0.9rem', fontSize: '0.8rem', color: '#ffd93d' }}>📈 Growing</span>
          )}
          {data?.level === 'poor' && (
            <span style={{ background: 'rgba(247,106,106,0.15)', border: '1px solid var(--accent2)', borderRadius: 999, padding: '0.3rem 0.9rem', fontSize: '0.8rem', color: 'var(--accent2)' }}>💪 Keep Trying</span>
          )}
        </div>
      </div>

      {/* AI Recommendations Section */}
      <div style={{ marginTop: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🤖 AI Recommendations
          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', background: 'rgba(124,106,247,0.15)', border: '1px solid var(--accent)', borderRadius: 999, padding: '0.15rem 0.6rem' }}>
            Powered by Gemini
          </span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.2rem' }}>
          Curated YouTube videos to help you improve and stay motivated
        </p>

        {recsLoading ? (
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <div className="loading" style={{ margin: 0 }}>Generating recommendations...</div>
          </div>
        ) : recsError ? (
          <div style={{
            background: 'rgba(247,106,106,0.1)', border: '1px solid rgba(247,106,106,0.3)',
            borderRadius: 12, padding: '1rem 1.2rem', color: '#f76a6a', fontSize: '0.9rem'
          }}>
            ⚠️ {recsError}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {recs.map((rec, i) => (
              <a
                key={i}
                href={rec.search_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: 'var(--bg-card2)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: '1.1rem 1.2rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, transform 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem' }}>
                    <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>▶️</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.3rem', lineHeight: 1.3 }}>
                        {rec.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        {rec.reason}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    marginTop: '0.8rem', fontSize: '0.75rem', color: 'var(--accent)',
                    display: 'flex', alignItems: 'center', gap: '0.3rem'
                  }}>
                    🔗 Search on YouTube
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
