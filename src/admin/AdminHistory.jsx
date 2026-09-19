import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { parseStudentNameAndPin } from '../utils/studentHelper'
import './AdminDashboard.css'

function getSessionMode(session) {
  if (session.mode) {
    return session.mode === 'practice' ? 'practice' : 'test'
  }
  if (session.started_at && session.started_at.includes('.111')) {
    return 'practice'
  }
  return 'test'
}

export default function AdminHistory({ onBack }) {
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [deletingId, setDeletingId] = useState(null)
  const [batchDeleting, setBatchDeleting] = useState(false)
  const [filter, setFilter] = useState('all') // 'all' | 'exam' | 'practice' | 'passed' | 'failed'
  const [searchTerm, setSearchTerm] = useState('')
  const [feedback, setFeedback] = useState(null)

  async function loadSessions() {
    setLoading(true)
    setFeedback(null)
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
          started_at,
          completed_at,
          users (name),
          subjects (name)
        `)
        .order('completed_at', { ascending: false })
        .limit(300)

      if (error) throw error
      setSessions(data || [])
      setSelectedIds([])
    } catch (err) {
      console.error('Gagal memuat riwayat tes:', err)
      setFeedback({ type: 'error', message: 'Gagal memuat riwayat tes.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const counts = {
    all: sessions.length,
    exam: sessions.filter((s) => getSessionMode(s) === 'test').length,
    practice: sessions.filter((s) => getSessionMode(s) === 'practice').length,
    passed: sessions.filter((s) => s.passed).length,
    failed: sessions.filter((s) => !s.passed).length,
  }

  const filtered = sessions.filter((item) => {
    const mode = getSessionMode(item)
    if (filter === 'exam' && mode !== 'test') return false
    if (filter === 'practice' && mode !== 'practice') return false
    if (filter === 'passed' && !item.passed) return false
    if (filter === 'failed' && item.passed) return false

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      const studentName = parseStudentNameAndPin(item.users?.name).name.toLowerCase()
      const subjectName = (item.subjects?.name || '').toLowerCase()
      return studentName.includes(term) || subjectName.includes(term)
    }
    return true
  })

  function toggleSelectRow(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  function toggleSelectAll() {
    if (filtered.length > 0 && selectedIds.length === filtered.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map((s) => s.id))
    }
  }

  async function handleDeleteSingle(session) {
    const studentName = parseStudentNameAndPin(session.users?.name).name || 'Peserta'
    const subjectName = session.subjects?.name || 'Mata Pelajaran'
    const modeLabel = getSessionMode(session) === 'practice' ? 'Latihan' : 'Ujian'

    const confirmed = window.confirm(
      `Hapus riwayat ${modeLabel} "${studentName}"?\n(Mata Pelajaran: ${subjectName} | Skor: ${session.score})\n\nTindakan ini tidak dapat dibatalkan.`
    )
    if (!confirmed) return

    setDeletingId(session.id)
    setFeedback(null)

    try {
      await supabase
        .from('test_answers')
        .delete()
        .eq('test_session_id', session.id)

      const { error } = await supabase
        .from('test_sessions')
        .delete()
        .eq('id', session.id)

      if (error) throw error

      setSessions((prev) => prev.filter((s) => s.id !== session.id))
      setSelectedIds((prev) => prev.filter((id) => id !== session.id))
      setFeedback({ type: 'success', message: `Riwayat ${modeLabel} ${studentName} berhasil dihapus.` })
    } catch (err) {
      console.error('Gagal menghapus riwayat tes:', err)
      setFeedback({ type: 'error', message: 'Gagal menghapus riwayat tes.' })
    } finally {
      setDeletingId(null)
    }
  }

  async function handleDeleteBatch(idsToDelete, isAll = false) {
    if (!idsToDelete || idsToDelete.length === 0) return

    const message = isAll
      ? `⚠️ PERINGATAN BESAR:\nApakah Anda yakin ingin MENGHAPUS SEMUA (${idsToDelete.length}) riwayat tes peserta?\n\nSemua riwayat ujian, latihan, dan detail jawaban siswa akan dihapus permanen.`
      : `Hapus ${idsToDelete.length} riwayat tes yang dipilih secara permanen?`

    const confirmed = window.confirm(message)
    if (!confirmed) return

    setBatchDeleting(true)
    setFeedback(null)

    try {
      await supabase
        .from('test_answers')
        .delete()
        .in('test_session_id', idsToDelete)

      const { error } = await supabase
        .from('test_sessions')
        .delete()
        .in('id', idsToDelete)

      if (error) throw error

      const idSet = new Set(idsToDelete)
      setSessions((prev) => prev.filter((s) => !idSet.has(s.id)))
      setSelectedIds([])
      setFeedback({
        type: 'success',
        message: `Berhasil menghapus ${idsToDelete.length} riwayat tes.`,
      })
    } catch (err) {
      console.error('Gagal menghapus riwayat massal:', err)
      setFeedback({ type: 'error', message: 'Gagal menghapus riwayat massal.' })
    } finally {
      setBatchDeleting(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <button className="admin-back-button" onClick={onBack}>
            ← Kembali ke Menu Admin
          </button>
          <h1 style={{ marginTop: '12px' }}>Riwayat Tes Peserta</h1>
          <p className="admin-subtitle">Rekam jejak pengerjaan ujian, latihan, skor, dan kelulusan siswa.</p>
        </div>
      </div>

      <div className="history-controls">
        <div className="history-filter-tabs">
          <button
            className="admin-back-button"
            style={{
              background: filter === 'all' ? '#edf2ee' : '#fffdf8',
              fontWeight: filter === 'all' ? 700 : 500,
            }}
            onClick={() => setFilter('all')}
          >
            Semua ({counts.all})
          </button>
          <button
            className="admin-back-button"
            style={{
              background: filter === 'exam' ? '#f3eff9' : '#fffdf8',
              color: filter === 'exam' ? '#5c4587' : undefined,
              fontWeight: filter === 'exam' ? 700 : 500,
            }}
            onClick={() => setFilter('exam')}
          >
            ✓ Ujian ({counts.exam})
          </button>
          <button
            className="admin-back-button"
            style={{
              background: filter === 'practice' ? '#edf6f9' : '#fffdf8',
              color: filter === 'practice' ? '#27677a' : undefined,
              fontWeight: filter === 'practice' ? 700 : 500,
            }}
            onClick={() => setFilter('practice')}
          >
            ✎ Latihan ({counts.practice})
          </button>
          <button
            className="admin-back-button"
            style={{
              background: filter === 'passed' ? '#eaf3ee' : '#fffdf8',
              color: filter === 'passed' ? '#3b6b55' : undefined,
              fontWeight: filter === 'passed' ? 700 : 500,
            }}
            onClick={() => setFilter('passed')}
          >
            Lulus ({counts.passed})
          </button>
          <button
            className="admin-back-button"
            style={{
              background: filter === 'failed' ? '#faf0ed' : '#fffdf8',
              color: filter === 'failed' ? '#9a6458' : undefined,
              fontWeight: filter === 'failed' ? 700 : 500,
            }}
            onClick={() => setFilter('failed')}
          >
            Belum Lulus ({counts.failed})
          </button>
        </div>

        <div>
          <input
            type="text"
            className="history-search-input"
            placeholder="🔍 Cari nama peserta / mapel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {feedback && (
        <div className={`history-alert ${feedback.type}`}>
          {feedback.type === 'success' ? '✓ ' : '⚠️ '}
          {feedback.message}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="history-batch-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#30443f' }}>
              {selectedIds.length} riwayat dipilih
            </span>
            <button
              type="button"
              className="admin-back-button"
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              onClick={() => setSelectedIds([])}
              disabled={batchDeleting}
            >
              Batal Pilih
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="history-del-btn"
              style={{ background: '#b94040', color: '#fff', padding: '6px 12px', fontSize: '0.85rem' }}
              onClick={() => handleDeleteBatch(selectedIds, false)}
              disabled={batchDeleting}
            >
              {batchDeleting ? 'Menghapus...' : `🗑️ Hapus Terpilih (${selectedIds.length})`}
            </button>
          </div>
        </div>
      )}

      <div className="admin-content" style={{ marginTop: '14px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#577067' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
            <p style={{ margin: 0, fontWeight: 600 }}>Memuat riwayat...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-recent-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#7a857f' }}>
            {sessions.length === 0
              ? 'Belum ada data riwayat tes.'
              : 'Tidak ada data riwayat yang sesuai dengan filter atau pencarian.'}
          </div>
        ) : (
          <div className="admin-recent-card">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '36px' }}>
                      <input
                        type="checkbox"
                        checked={filtered.length > 0 && selectedIds.length === filtered.length}
                        onChange={toggleSelectAll}
                        disabled={batchDeleting}
                        aria-label="Pilih semua baris"
                      />
                    </th>
                    <th>Peserta</th>
                    <th>Tipe</th>
                    <th>Mata Pelajaran</th>
                    <th>Benar / Total</th>
                    <th>Skor</th>
                    <th>Status</th>
                    <th>Tanggal & Waktu</th>
                    <th style={{ textAlign: 'center', width: '80px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => {
                    const parsedUser = parseStudentNameAndPin(row.users?.name)
                    const mode = getSessionMode(row)
                    const isSelected = selectedIds.includes(row.id)
                    const isDeletingThis = deletingId === row.id

                    return (
                      <tr key={row.id} className={isSelected ? 'history-row-selected' : ''}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(row.id)}
                            disabled={batchDeleting || isDeletingThis}
                            aria-label={`Pilih riwayat ${parsedUser.name}`}
                          />
                        </td>
                        <td>
                          <strong>{parsedUser.name || 'Anonim'}</strong>
                          {parsedUser.pin && (
                            <span style={{ fontSize: '0.78rem', color: '#88948e', marginLeft: '6px' }}>
                              (PIN: {parsedUser.pin})
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={mode === 'practice' ? 'tag-practice' : 'tag-exam'}>
                            {mode === 'practice' ? '✎ Latihan' : '✓ Ujian'}
                          </span>
                        </td>
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
                        <td style={{ color: '#7a857f', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
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
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="history-del-btn"
                            onClick={() => handleDeleteSingle(row)}
                            disabled={isDeletingThis || batchDeleting}
                            title="Hapus riwayat ini"
                          >
                            {isDeletingThis ? '...' : 'Hapus'}
                          </button>
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
