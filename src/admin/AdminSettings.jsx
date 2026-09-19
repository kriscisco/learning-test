import { useEffect, useState } from 'react'
import { fetchAppSettings, updateAppSettings, DEFAULT_SETTINGS } from '../utils/settingsHelper'
import './AdminDashboard.css'

export default function AdminSettings({ onBack }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passThreshold, setPassThreshold] = useState(85)
  const [questionCounts, setQuestionCounts] = useState([5, 10, 20, 30])
  const [allowAll, setAllowAll] = useState(true)
  const [newCountInput, setNewCountInput] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [pinNotice, setPinNotice] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const settings = await fetchAppSettings()
      setPassThreshold(settings.passThreshold)
      setQuestionCounts(settings.questionCounts)
      setAllowAll(settings.allowAll)
      setLoading(false)
    }
    load()
  }, [])

  const handleAddCount = (e) => {
    e.preventDefault()
    const val = parseInt(newCountInput, 10)
    if (!val || val <= 0) return

    if (questionCounts.includes(val)) {
      setFeedback({ type: 'error', message: `Jumlah soal ${val} sudah ada dalam pilihan.` })
      return
    }

    const updated = [...questionCounts, val].sort((a, b) => a - b)
    setQuestionCounts(updated)
    setNewCountInput('')
    setFeedback(null)
  }

  const handleRemoveCount = (countToRemove) => {
    if (questionCounts.length <= 1) {
      setFeedback({ type: 'error', message: 'Minimal harus ada 1 opsi jumlah soal.' })
      return
    }
    setQuestionCounts(questionCounts.filter((c) => c !== countToRemove))
    setFeedback(null)
  }

  const handleResetCounts = () => {
    setQuestionCounts([...DEFAULT_SETTINGS.questionCounts])
    setAllowAll(DEFAULT_SETTINGS.allowAll)
    setFeedback(null)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const thresholdNum = parseInt(passThreshold, 10)

    if (isNaN(thresholdNum) || thresholdNum < 1 || thresholdNum > 100) {
      setFeedback({ type: 'error', message: 'Ambang batas kelulusan harus bernilai antara 1 sampai 100.' })
      return
    }

    if (!questionCounts || questionCounts.length === 0) {
      setFeedback({ type: 'error', message: 'Minimal harus ada 1 opsi jumlah soal.' })
      return
    }

    setSaving(true)
    setFeedback(null)

    const res = await updateAppSettings({
      passThreshold: thresholdNum,
      questionCounts,
      allowAll,
    })

    setSaving(false)
    if (res.success) {
      setFeedback({
        type: 'success',
        message: 'Pengaturan berhasil disimpan dan langsung diterapkan ke seluruh siswa!',
      })
    } else {
      setFeedback({
        type: 'error',
        message: `Gagal menyimpan ke database: ${res.error || 'Terjadi kesalahan.'}`,
      })
    }
  }

  const handleTestPin = () => {
    setPinNotice(
      'Untuk mengubah PIN Admin, atur variabel VITE_ADMIN_PIN di file .env.local atau Environment Variables Netlify (Default saat ini: 123456).'
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <button className="admin-back-button" onClick={onBack}>
            ← Kembali ke Menu Admin
          </button>
          <h1 style={{ marginTop: '12px' }}>Pengaturan Aplikasi</h1>
          <p className="admin-subtitle">
            Konfigurasi standar kelulusan (KKM), opsi kuota soal ujian/latihan, dan keamanan.
          </p>
        </div>
      </div>

      <div className="admin-content" style={{ marginTop: '24px', maxWidth: '780px' }}>
        {feedback && (
          <div className={`history-alert ${feedback.type}`} style={{ marginBottom: '20px' }}>
            {feedback.type === 'success' ? '✓ ' : '⚠️ '}
            {feedback.message}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#577067' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
            <p style={{ margin: 0, fontWeight: 600 }}>Memuat konfigurasi...</p>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            {/* 1. Standar Kelulusan */}
            <div className="admin-recent-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: '0 0 6px', fontSize: '1.2rem', color: '#26332f' }}>
                    Standar Kelulusan Ujian (KKM)
                  </h2>
                  <p style={{ margin: '0 0 16px', color: '#7a857f', fontSize: '0.88rem' }}>
                    Nilai minimum yang wajib dicapai siswa untuk dinyatakan Lulus.
                  </p>
                </div>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: '#3d6957',
                    background: '#eaf3ee',
                    padding: '8px 18px',
                    borderRadius: '12px',
                    border: '1px solid #c9e4d5',
                  }}
                >
                  {passThreshold}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label htmlFor="threshold-input" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#303530' }}>
                    Ubah Nilai KKM:
                  </label>
                  <input
                    id="threshold-input"
                    type="number"
                    min="1"
                    max="100"
                    value={passThreshold}
                    onChange={(e) => setPassThreshold(e.target.value)}
                    style={{
                      width: '80px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #d0cbc2',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      background: '#fff',
                      color: '#26332f',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#828c86' }}>Pilihan Cepat:</span>
                  {[70, 75, 80, 85, 90].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className="admin-back-button"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.82rem',
                        fontWeight: Number(passThreshold) === val ? 700 : 500,
                        background: Number(passThreshold) === val ? '#e4efe9' : '#fffdf8',
                        borderColor: Number(passThreshold) === val ? '#7faaa0' : '#e4e0d6',
                      }}
                      onClick={() => setPassThreshold(val)}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Kustomisasi Jumlah Soal */}
            <div className="admin-recent-card" style={{ marginTop: '22px' }}>
              <h2 style={{ margin: '0 0 6px', fontSize: '1.2rem', color: '#26332f' }}>
                Pilihan Jumlah Soal (Latihan & Ulangan)
              </h2>
              <p style={{ margin: '0 0 16px', color: '#7a857f', fontSize: '0.88rem' }}>
                Tentukan tombol kuota soal apa saja yang dapat dipilih siswa sebelum mulai mengerjakan tes.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#444d48', marginBottom: '8px' }}>
                  Opsi Jumlah Soal Aktif:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {questionCounts.map((count) => (
                    <span
                      key={count}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#f2eee5',
                        border: '1px solid #ddd7ca',
                        borderRadius: '999px',
                        padding: '5px 12px',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: '#344541',
                      }}
                    >
                      {count} Soal
                      <button
                        type="button"
                        onClick={() => handleRemoveCount(count)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#a84848',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: '1rem',
                          lineHeight: 1,
                          padding: '0 2px',
                        }}
                        title={`Hapus opsi ${count} soal`}
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  {allowAll && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: '#eaf3ee',
                        border: '1px solid #c9e4d5',
                        borderRadius: '999px',
                        padding: '5px 12px',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: '#3d6957',
                      }}
                    >
                      Semua Soal
                    </span>
                  )}
                </div>
              </div>

              {/* Tambah Opsi Jumlah Soal Baru */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  padding: '14px 0',
                  borderTop: '1px solid #eef2ed',
                  borderBottom: '1px solid #eef2ed',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label htmlFor="new-count-input" style={{ fontSize: '0.85rem', color: '#444d48', fontWeight: 600 }}>
                    + Tambah Opsi Jumlah:
                  </label>
                  <input
                    id="new-count-input"
                    type="number"
                    min="1"
                    placeholder="Contoh: 15"
                    value={newCountInput}
                    onChange={(e) => setNewCountInput(e.target.value)}
                    style={{
                      width: '110px',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: '1px solid #d0cbc2',
                      fontSize: '0.9rem',
                    }}
                  />
                  <button
                    type="button"
                    className="admin-back-button"
                    onClick={handleAddCount}
                    style={{ fontWeight: 700, background: '#557b70', color: '#fff', borderColor: '#557b70' }}
                  >
                    + Tambahkan
                  </button>
                </div>

                <button
                  type="button"
                  className="admin-back-button"
                  onClick={handleResetCounts}
                  style={{ fontSize: '0.8rem', color: '#7a857f' }}
                >
                  ↺ Reset ke Default (5, 10, 20, 30)
                </button>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#303530' }}>
                  <input
                    type="checkbox"
                    checked={allowAll}
                    onChange={(e) => setAllowAll(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#557b70', cursor: 'pointer' }}
                  />
                  <span>Tampilkan tombol pilihan <strong>"Semua Soal"</strong> kepada siswa</span>
                </label>
              </div>
            </div>

            {/* Tombol Simpan */}
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  background: '#557b70',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(85, 123, 112, 0.25)',
                }}
              >
                {saving ? 'Menyimpan...' : '💾 Simpan Perubahan Pengaturan'}
              </button>
            </div>
          </form>
        )}

        {/* 3. Keamanan Admin */}
        <div className="admin-recent-card" style={{ marginTop: '24px' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: '1.2rem', color: '#26332f' }}>Keamanan Admin Panel</h2>
          <p style={{ margin: '0 0 16px', color: '#7a857f', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Akses ke halaman Admin dilindungi dengan kode PIN untuk mencegah siswa membuka konfigurasi atau melihat kunci jawaban tanpa izin.
          </p>
          <button className="admin-back-button" onClick={handleTestPin} style={{ fontWeight: 700 }}>
            ℹ️ Informasi Pengubahan PIN Admin
          </button>
          {pinNotice && (
            <div
              style={{
                marginTop: '14px',
                padding: '12px 16px',
                background: '#f4f0e7',
                borderRadius: '10px',
                color: '#59615b',
                fontSize: '0.88rem',
              }}
            >
              {pinNotice}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
