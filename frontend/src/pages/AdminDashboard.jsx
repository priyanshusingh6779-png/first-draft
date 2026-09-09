import { useState, useEffect } from 'react'
import api from '../api/api'
import SqlQueryDialog from '../components/SqlQueryDialog'

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sqlData, setSqlData] = useState({ open: false, query: '', working: '' })

  useEffect(() => {
    api.get('/admin/users')
      .then(res => {
        setUsers(res.data)
        if (res.data.length > 0) {
          setSqlData({
            open: true,
            query: res.data[0].sql_query,
            working: "This dashboard uses a database VIEW called 'admin_users_view'. It automatically joins multiple tables (users, habits, tasks) to provide a real-time summary of all user activities."
          })
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page"><div className="loading">Loading admin panel...</div></div>

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      <h1 className="page-title">Admin Dashboard 🛡️</h1>
      <p className="page-subtitle">Overview of all user progress</p>
      
      <div className="card" style={{ marginTop: '2rem' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem', fontWeight: 600 }}>User ID</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Username</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Email</th>
               <th style={{ padding: '1rem', fontWeight: 600 }}>Weekly Score</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Tasks Done</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>

            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem', color: 'var(--accent)' }}>#{u.user_id}</td>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{u.username}</td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{u.email}</td>
                <td style={{ padding: '1rem', fontWeight: 600 }}>{u.weekly_total} pts</td>
                <td style={{ padding: '1rem', color: 'var(--accent)', fontWeight: 600 }}>{u.tasks_completed} ✅</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    background: u.level === 'great' ? 'rgba(76, 175, 80, 0.2)' : u.level === 'moderate' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                    color: u.level === 'great' ? '#4CAF50' : u.level === 'moderate' ? '#FF9800' : '#F44336',
                    padding: '4px 8px', borderRadius: 4, fontSize: '0.85rem', fontWeight: 600
                  }}>
                    {u.level.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No other users registered yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <SqlQueryDialog 
        isOpen={sqlData.open} 
        onClose={() => setSqlData({ ...sqlData, open: false })}
        query={sqlData.query}
        working={sqlData.working}
      />
    </div>
  )
}
