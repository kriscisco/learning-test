import { useState, lazy, Suspense } from 'react'
import './Admin.css'

const SubjectsEditor = lazy(() => import('./SubjectsEditor'))
const QuestionEditor = lazy(() => import('./QuestionEditor'))
const QuestionImporter = lazy(() => import('./QuestionImporter'))

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

function Admin({ onBack }) {
  const [showSubjectsEditor, setShowSubjectsEditor] = useState(false)
  const [showQuestionEditor, setShowQuestionEditor] = useState(false)
  const [showQuestionImporter, setShowQuestionImporter] = useState(false)

  if (showSubjectsEditor) {
    return (
      <Suspense fallback={<AdminLoadingFallback />}>
        <SubjectsEditor
          onBack={() => setShowSubjectsEditor(false)}
        />
      </Suspense>
    )
  }

  if (showQuestionEditor) {
    return (
      <Suspense fallback={<AdminLoadingFallback />}>
        <QuestionEditor
          onBack={() => setShowQuestionEditor(false)}
        />
      </Suspense>
    )
  }

  if (showQuestionImporter) {
    return (
      <Suspense fallback={<AdminLoadingFallback />}>
        <QuestionImporter
          onBack={() => setShowQuestionImporter(false)}
        />
      </Suspense>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <button
            className="admin-back-button"
            onClick={onBack}
          >
            ← Kembali ke Halaman Utama
          </button>

          <h1>Admin Panel</h1>

          <p>
            Kelola materi, soal, peserta, dan riwayat Learning Test.
          </p>
        </div>
      </div>

      <div className="admin-menu-grid">
        <button className="admin-menu-card">
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
          onClick={() => setShowQuestionImporter(true)}
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
          onClick={() => setShowQuestionEditor(true)}
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
          onClick={() => setShowSubjectsEditor(true)}
        >
          <span className="admin-menu-icon">📚</span>

          <span className="admin-menu-title">
            Mata Pelajaran
          </span>

          <span className="admin-menu-description">
            Tambah, edit, aktifkan, atau nonaktifkan mata pelajaran.
          </span>
        </button>

        <button className="admin-menu-card">
          <span className="admin-menu-icon">👥</span>

          <span className="admin-menu-title">
            Peserta
          </span>

          <span className="admin-menu-description">
            Lihat daftar peserta dan aktivitas mereka.
          </span>
        </button>

        <button className="admin-menu-card">
          <span className="admin-menu-icon">📋</span>

          <span className="admin-menu-title">
            Riwayat Tes
          </span>

          <span className="admin-menu-description">
            Lihat skor, tanggal, waktu, dan status hasil tes.
          </span>
        </button>

        <button className="admin-menu-card">
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