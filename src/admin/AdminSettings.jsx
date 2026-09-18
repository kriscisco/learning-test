import { useState } from 'react'
import './AdminDashboard.css'

export default function AdminSettings({ onBack }) {
  const [passThreshold] = useState(85)
  const [pinNotice, setPinNotice] = useState('')

  const handleTestPin = () => {
    setPinNotice('Untuk mengubah PIN Admin, atur variabel VITE_ADMIN_PIN di file .env.local (Default saat ini: 123456).')
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <button className="admin-back-button" onClick={onBack}>
            ← Kembali ke Menu Admin
          </button>
          <h1 style={{ marginTop: '12px' }}>Pengaturan Aplikasi</h1>
          <p className="admin-subtitle">Konfigurasi standar aplikasi, ambang batas kelulusan, dan keamanan.</p>
        </div>
      </div>

      <div className="admin-content" style={{ marginTop: '28px', maxWidth: '780px' }}>
        <div className="admin-recent-card">
          <h2 style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#26332f' }}>Standar Kelulusan Ujian</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #eef2ed' }}>
            <div>
              <strong style={{ display: 'block', color: '#303530' }}>Batas Nilai Lulus (Pass Threshold)</strong>
              <small style={{ color: '#7a857f' }}>Siswa dinyatakan lulus jika mencapai skor minimal ini</small>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#426b5a', background: '#eaf3ee', padding: '6px 14px', borderRadius: '10px' }}>
              {passThreshold}
            </div>
          </div>
        </div>

        <div className="admin-recent-card" style={{ marginTop: '20px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.2rem', color: '#26332f' }}>Keamanan Admin Panel</h2>
          <p style={{ margin: '0 0 16px', color: '#7a857f', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Akses ke halaman Admin dilindungi dengan modal kode PIN/Passcode untuk mencegah siswa membuka pengaturan soal tanpa izin.
          </p>
          <button
            className="admin-back-button"
            onClick={handleTestPin}
            style={{ fontWeight: 700 }}
          >
            ℹ️ Informasi Pengubahan PIN
          </button>
          {pinNotice && (
            <div style={{ marginTop: '14px', padding: '12px 16px', background: '#f4f0e7', borderRadius: '10px', color: '#59615b', fontSize: '0.88rem' }}>
              {pinNotice}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
