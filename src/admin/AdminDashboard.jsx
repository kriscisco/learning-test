import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import './AdminDashboard.css'

export default function AdminDashboard({ onBack }) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalQuestions: 0,
    totalTests: 0,
    averageScore: 0,
    passRate: 0,
  })
  const [recentTests, setRecentTests] = useState([])

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true)

      try {
        const [usersRes, questionsRes, sessionsRes] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('questions').select('id', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('test_sessions').select(`
            id,
            score,
            passed,
            created_at,
            users (name),
            subjects (name)
          `).order('created_at', { ascending: false }).limit(10)
        ])

        const totalStudents = usersRes.count || 0
        const totalQuestions = questionsRes.count || 0
        const testList = sessionsRes.data || []

        let avg = 0
        let passCount = 0
        if (testList.length > 0) {
          const sum = testList.reduce((acc, curr) => acc + (curr.score || 0), 0)
          avg = sum / testList.length
          passCount = testList.filter((t) => t.passed).length
        }

        setStats({
          totalStudents,
          totalQuestions,
          totalTests: testList.length,
          averageScore: Number(avg.toFixed(1)),
          passRate: testList.length > 0 ? Math.round((passCount / testList.length) * 100) : 0,
        })
        setRecentTests(testList)
      } catch (err) {
        console.error('Gagal memuat dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <button className="admin-back-button" onClick={onBack}>
            ← Kembali ke Menu Admin
          </button>
          <h1 style={{ marginTop: '12px' }}>Dashboard Ringkasan</h1>
          <p className="admin-subtitle">Statistik aktivitas siswa, soal ujian, dan evaluasi hasil tes.</p>
        </div>
      </div>

      <div className="admin-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#577067' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
            <p style={{ margin: 0, fontWeight: 600 }}>Memuat data statistik...</p>
          </div>
        ) : (
          <>
            <div className="admin-stat-grid" style={{ marginTop: '28px' }}>
              <div className="admin-stat-card">
                <span>TOTAL PESERTA</span>
                <strong>{stats.totalStudents}</strong>
                <small>Siswa terdaftar</small>
              </div>
              <div className="admin-stat-card">
                <span>SOAL AKTIF</span>
                <strong>{stats.totalQuestions}</strong>
                <small>Tersedia di bank soal</small>
              </div>
              <div className="admin-stat-card">
                <span>RATA-RATA NILAI</span>
                <strong>{stats.averageScore}</strong>
                <small>Dari tes terbaru</small>
              </div>
              <div className="admin-stat-card">
                <span>TINGKAT KELULUSAN</span>
                <strong>{stats.passRate}%</strong>
                <small>Ambang batas ≥ 85</small>
              </div>
            </div>

            <div className="admin-recent-card" style={{ marginTop: '34px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#26332f' }}>Aktivitas Tes Terbaru</h2>
                <span className="admin-badge">{recentTests.length} Terakhir</span>
              </div>

              {recentTests.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#7a857f' }}>
                  Belum ada sesi tes yang tercatat.
                </div>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Peserta</th>
                        <th>Mata Pelajaran</th>
                        <th>Nilai</th>
                        <th>Status</th>
                        <th>Waktu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTests.map((item) => (
                        <tr key={item.id}>
                          <td><strong>{item.users?.name || 'Anonim'}</strong></td>
                          <td>{item.subjects?.name || '-'}</td>
                          <td>
                            <span style={{ fontWeight: 800, color: item.passed ? '#426b5a' : '#9a6458' }}>
                              {item.score}
                            </span>
                          </td>
                          <td>
                            <span className={item.passed ? 'tag-passed' : 'tag-failed'}>
                              {item.passed ? 'Lulus' : 'Belum Lulus'}
                            </span>
                          </td>
                          <td style={{ color: '#7a857f', fontSize: '0.85rem' }}>
                            {new Date(item.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
