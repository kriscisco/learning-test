import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { parseStudentNameAndPin } from '../utils/studentHelper'
import './AdminDashboard.css'

export default function AdminHistory({ onBack }) {
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function loadSessions() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('test_sessions')
          .select(`
            id,
            score,
            passed,
            total_questions,
            correct_answers,
            wrong_answers,
            completed_at,
            users (name),
            subjects (name)
          `)
          .order('completed_at', { ascending: false })
          .limit(100)

        if (error) throw error
        setSessions(data || [])
      } catch (err) {
        console.error('Gagal memuat riwayat tes:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSessions()
  }, [])

  const filtered = sessions.filter((item) => {
    if (filter === 'passed') return item.passed
    if (filter === 'failed') return !item.passed
    return true
  })

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <button className="admin-back-button" onClick={onBack}>
            ← Kembali ke Menu Admin
          </button>
          <h1 style={{ marginTop: '12px' }}>Riwayat Tes Peserta</h1>
          <p className="admin-subtitle">Rekam jejak pengerjaan ujian, skor, dan kelulusan siswa.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
          <button
            className="admin-back-button"
            style={{ background: filter === 'all' ? '#edf2ee' : '#fffdf8' }}
            onClick={() => setFilter('all')}
          >
            Semua ({sessions.length})
          </button>
          <button
            className="admin-back-button"
            style={{ background: filter === 'passed' ? '#eaf3ee' : '#fffdf8' }}
            onClick={() => setFilter('passed')}
          >
            Lulus
          </button>
          <button
            className="admin-back-button"
            style={{ background: filter === 'failed' ? '#faf0ed' : '#fffdf8' }}
            onClick={() => setFilter('failed')}
          >
            Belum Lulus
          </button>
        </div>
      </div>

      <div className="admin-content" style={{ marginTop: '28px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#577067' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
            <p style={{ margin: 0, fontWeight: 600 }}>Memuat riwayat...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-recent-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#7a857f' }}>
            Tidak ada data riwayat yang sesuai filter.
          </div>
        ) : (
          <div className="admin-recent-card">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Peserta</th>
                    <th>Mata Pelajaran</th>
                    <th>Benar / Total</th>
                    <th>Skor</th>
                    <th>Status</th>
                    <th>Tanggal & Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    const parsedUser = parseStudentNameAndPin(row.users?.name)
                    return (
                      <tr key={row.id}>
                        <td><strong>{parsedUser.name || 'Anonim'}</strong></td>
                        <td>{row.subjects?.name || '-'}</td>
                        <td>{row.correct_answers} / {row.total_questions}</td>
                        <td>
                          <strong style={{ color: row.passed ? '#426b5a' : '#9a6458', fontSize: '1.05rem' }}>
                            {row.score}
                          </strong>
                        </td>
                        <td>
                          <span className={row.passed ? 'tag-passed' : 'tag-failed'}>
                            {row.passed ? 'Lulus' : 'Belum Lulus'}
                          </span>
                        </td>
                        <td style={{ color: '#7a857f', fontSize: '0.85rem' }}>
                          {row.completed_at
                            ? new Date(row.completed_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
