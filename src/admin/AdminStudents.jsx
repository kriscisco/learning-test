import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import './AdminDashboard.css'

export default function AdminStudents({ onBack }) {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadStudents() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, created_at')
          .order('created_at', { ascending: false })
          .limit(200)

        if (error) throw error
        setStudents(data || [])
      } catch (err) {
        console.error('Gagal memuat peserta:', err)
      } finally {
        setLoading(false)
      }
    }
    loadStudents()
  }, [])

  const filtered = students.filter((s) =>
    (s.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <button className="admin-back-button" onClick={onBack}>
            ← Kembali ke Menu Admin
          </button>
          <h1 style={{ marginTop: '12px' }}>Daftar Peserta</h1>
          <p className="admin-subtitle">Daftar siswa yang telah terdaftar dan mengikuti pembelajaran.</p>
        </div>

        <div style={{ minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Cari nama peserta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #ccd3ce',
              borderRadius: '12px',
              background: '#fffdf8',
              outline: 'none',
              font: 'inherit'
            }}
          />
        </div>
      </div>

      <div className="admin-content" style={{ marginTop: '28px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#577067' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
            <p style={{ margin: 0, fontWeight: 600 }}>Memuat data peserta...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-recent-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#7a857f' }}>
            Tidak ada data peserta yang cocok.
          </div>
        ) : (
          <div className="admin-recent-card">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Siswa</th>
                    <th>User ID</th>
                    <th>Waktu Bergabung</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student, idx) => (
                    <tr key={student.id}>
                      <td style={{ color: '#7a857f', width: '60px' }}>{idx + 1}</td>
                      <td><strong>{student.name}</strong></td>
                      <td style={{ color: '#88918a', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                        {student.id.slice(0, 8)}...
                      </td>
                      <td style={{ color: '#7a857f', fontSize: '0.85rem' }}>
                        {new Date(student.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
