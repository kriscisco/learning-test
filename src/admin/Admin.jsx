import { useState, lazy, Suspense } from 'react'
import './Admin.css'

const SubjectsEditor = lazy(() => import('./SubjectsEditor'))
const QuestionEditor = lazy(() => import('./QuestionEditor'))
const QuestionImporter = lazy(() => import('./QuestionImporter'))
const AdminDashboard = lazy(() => import('./AdminDashboard'))
const AdminStudents = lazy(() => import('./AdminStudents'))
const AdminHistory = lazy(() => import('./AdminHistory'))
const AdminSettings = lazy(() => import('./AdminSettings'))

function AdminLoadingFallback() {
  return (
    <div className="admin-page" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', color: '#577067' }}>
        <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>⏳</div>
        <p style={{ margin: 0, fontWeight: 600 }}>Memuat modul admin...</p>
      </div>
    </div>
  )
}

function Admin({ onBack, onLogout }) {
  const [activeView, setActiveView] = useState('menu')

  if (activeView === 'subjects') {
    return (
      <Suspense fallback={<AdminLoadingFallback />}>
        <SubjectsEditor onBack={() => setActiveView('menu')} />
      </Suspense>
    )
  }

  if (activeView === 'questions') {
    return (
      <Suspense fallback={<AdminLoadingFallback />}>
        <QuestionEditor onBack={() => setActiveView('menu')} />
      </Suspense>
    )
  }

  if (activeView === 'importer') {
    return (
      <Suspense fallback={<AdminLoadingFallback />}>
        <QuestionImporter onBack={() => setActiveView('menu')} />
      </Suspense>
    )
  }

  if (activeView === 'dashboard') {
    return (
      <Suspense fallback={<AdminLoadingFallback />}>
        <AdminDashboard onBack={() => setActiveView('menu')} />
      </Suspense>
    )
  }

  if (activeView === 'students') {
    return (
      <Suspense fallback={<AdminLoadingFallback />}>
        <AdminStudents onBack={() => setActiveView('menu')} />
      </Suspense>
    )
  }

  if (activeView === 'history') {
    return (
      <Suspense fallback={<AdminLoadingFallback />}>
        <AdminHistory onBack={() => setActiveView('menu')} />
      </Suspense>
    )
  }

  if (activeView === 'settings') {
    return (
      <Suspense fallback={<AdminLoadingFallback />}>
        <AdminSettings onBack={() => setActiveView('menu')} />
      </Suspense>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
            <button
              className="admin-back-button"
              onClick={onBack}
            >
              ← Ke Halaman Utama
            </button>
            <button
              className="admin-back-button"
              onClick={onLogout}
              style={{
                color: '#9a6458',
                borderColor: '#e8d8d3',
                background: '#fdfbf9',
              }}
            >
              🚪 Keluar (Logout)
            </button>
          </div>

          <h1>Admin Panel</h1>

          <p>
            Kelola materi, soal, peserta, dan riwayat Learning Test.
          </p>
        </div>
      </div>

      <div className="admin-menu-grid">
        <button
          className="admin-menu-card"
          onClick={() => setActiveView('dashboard')}
        >
          <span className="admin-menu-icon">📊</span>

          <span className="admin-menu-title">
            Dashboard
          </span>

          <span className="admin-menu-description">
            Lihat ringkasan peserta, soal, dan hasil tes.
          </span>
        </button>

        <button
          className="admin-menu-card"
          onClick={() => setActiveView('importer')}
        >
          <span className="admin-menu-icon">📄</span>

          <span className="admin-menu-title">
            Import Soal
          </span>

          <span className="admin-menu-description">
            Upload TXT atau DOCX berisi banyak soal sekaligus.
          </span>
        </button>

        <button
          className="admin-menu-card"
          onClick={() => setActiveView('questions')}
        >
          <span className="admin-menu-icon">📝</span>

          <span className="admin-menu-title">
            Editor Soal
          </span>

          <span className="admin-menu-description">
            Lihat dan kelola soal secara individual.
          </span>
        </button>

        <button
          className="admin-menu-card"
          onClick={() => setActiveView('subjects')}
        >
          <span className="admin-menu-icon">📚</span>

          <span className="admin-menu-title">
            Mata Pelajaran
          </span>

          <span className="admin-menu-description">
            Tambah, edit, aktifkan, atau nonaktifkan mata pelajaran.
          </span>
        </button>

        <button
          className="admin-menu-card"
          onClick={() => setActiveView('students')}
        >
          <span className="admin-menu-icon">👥</span>

          <span className="admin-menu-title">
            Peserta
          </span>

          <span className="admin-menu-description">
            Lihat daftar peserta dan aktivitas mereka.
          </span>
        </button>

        <button
          className="admin-menu-card"
          onClick={() => setActiveView('history')}
        >
          <span className="admin-menu-icon">📋</span>

          <span className="admin-menu-title">
            Riwayat Tes
          </span>

          <span className="admin-menu-description">
            Lihat skor, tanggal, waktu, dan status hasil tes.
          </span>
        </button>

        <button
          className="admin-menu-card"
          onClick={() => setActiveView('settings')}
        >
          <span className="admin-menu-icon">⚙️</span>

          <span className="admin-menu-title">
            Pengaturan
          </span>

          <span className="admin-menu-description">
            Pengaturan aplikasi dan konfigurasi lainnya.
          </span>
        </button>
      </div>
    </div>
  )
}

export default Admin