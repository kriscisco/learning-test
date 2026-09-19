import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { parseStudentNameAndPin, formatStudentNameWithPin } from '../utils/studentHelper'
import './AdminDashboard.css'

export default function AdminStudents({ onBack }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')

  // State tambah siswa
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [formError, setFormError] = useState('')

  async function loadStudents() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, created_at')
        .not('name', 'like', '__archived_%')
        .not('name', 'like', '__sys_%')
        .order('created_at', { ascending: false })

      if (error) throw error
      const validStudents = (data || []).filter((s) => !s.name?.startsWith('__'))
      setStudents(validStudents)
    } catch (err) {
      console.error('Gagal memuat peserta:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [])

  const handleAddStudent = async (e) => {
    e.preventDefault()
    const cleanName = newName.trim()
    const cleanPin = newPin.trim()

    if (!cleanName) {
      setFormError('Nama siswa wajib diisi.')
      return
    }
    if (!cleanPin) {
      setFormError('PIN siswa wajib diisi (misal: 1234).')
      return
    }

    // Cek apakah nama sudah terdaftar
    const isExist = students.some((s) => {
      const parsed = parseStudentNameAndPin(s.name)
      return parsed.name.toLowerCase() === cleanName.toLowerCase()
    })

    if (isExist) {
      setFormError(`Siswa dengan nama "${cleanName}" sudah terdaftar sebelumnya.`)
      return
    }

    setSaving(true)
    setFormError('')

    const formatted = formatStudentNameWithPin(cleanName, cleanPin)

    const { error } = await supabase
      .from('users')
      .insert({ name: formatted })

    setSaving(false)

    if (error) {
      console.error('Gagal menambahkan siswa:', error)
      setFormError('Gagal menambahkan siswa ke database. Silakan coba lagi.')
      return
    }

    setNewName('')
    setNewPin('')
    setShowAddModal(false)
    loadStudents()
  }

  const filtered = students.filter((s) => {
    const parsed = parseStudentNameAndPin(s.name)
    return (
      parsed.name.toLowerCase().includes(search.toLowerCase()) ||
      parsed.pin.includes(search)
    )
  })

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <button className="admin-back-button" onClick={onBack}>
            ← Kembali ke Menu Admin
          </button>
          <h1 style={{ marginTop: '12px' }}>Daftar Peserta & PIN</h1>
          <p className="admin-subtitle">Daftarkan nama siswa dan tentukan PIN agar mereka dapat login latihan.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Cari nama / PIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '1px solid #ccd3ce',
              borderRadius: '12px',
              background: '#fffdf8',
              outline: 'none',
              font: 'inherit',
              minWidth: '200px'
            }}
          />

          <button
            className="admin-back-button"
            onClick={() => {
              setFormError('')
              setShowAddModal(true)
            }}
            style={{
              background: '#58766e',
              color: '#fffdf8',
              borderColor: '#58766e',
              fontWeight: 700
            }}
          >
            + Daftarkan Siswa
          </button>
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
            Belum ada data siswa terdaftar. Klik <strong>"+ Daftarkan Siswa"</strong> untuk menambahkan.
          </div>
        ) : (
          <div className="admin-recent-card">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Siswa</th>
                    <th>PIN Masuk</th>
                    <th>Status Akun</th>
                    <th>Waktu Didaftarkan</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student, idx) => {
                    const parsed = parseStudentNameAndPin(student.name)
                    return (
                      <tr key={student.id}>
                        <td style={{ color: '#7a857f', width: '50px' }}>{idx + 1}</td>
                        <td>
                          <strong style={{ fontSize: '1rem', color: '#26332f' }}>{parsed.name}</strong>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              background: '#eef3ef',
                              color: '#426b5a',
                              fontWeight: 800,
                              letterSpacing: '0.1em',
                              fontFamily: 'monospace',
                              fontSize: '0.95rem'
                            }}
                          >
                            {parsed.pin || '-'}
                          </span>
                        </td>
                        <td>
                          <span className="tag-passed">Aktif & Terdaftar</span>
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
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div
          className="admin-modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <div className="admin-modal-header">
              <div className="admin-modal-icon">👤</div>
              <h2>Daftarkan Siswa Baru</h2>
              <p>Tentukan nama lengkap dan kode PIN masuk untuk siswa.</p>
            </div>

            <form onSubmit={handleAddStudent}>
              <div style={{ display: 'grid', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#303530' }}>
                    Nama Lengkap Siswa
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kristian, Sarah, Budi"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      border: '1px solid #d6d0c2',
                      borderRadius: '10px',
                      outline: 'none',
                      background: '#fffdf8',
                      font: 'inherit'
                    }}
                    autoFocus
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#303530' }}>
                    PIN Masuk Siswa (Angka/Karakter)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="Contoh: 1234 atau 2026"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      border: '1px solid #d6d0c2',
                      borderRadius: '10px',
                      outline: 'none',
                      background: '#fffdf8',
                      font: 'inherit',
                      letterSpacing: '0.15em',
                      fontWeight: 700
                    }}
                  />
                </div>

                {formError && (
                  <div className="admin-pin-error">
                    {formError}
                  </div>
                )}
              </div>

              <div className="admin-modal-actions" style={{ marginTop: '22px' }}>
                <button
                  type="button"
                  className="admin-modal-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="admin-modal-submit"
                  disabled={!newName.trim() || !newPin.trim() || saving}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
