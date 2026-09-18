import { useState } from 'react'
import SubjectsEditor from './SubjectsEditor'
import QuestionEditor from './QuestionEditor'
import QuestionImporter from './QuestionImporter'
import './Admin.css'

function Admin({ onBack }) {
  const [showSubjectsEditor, setShowSubjectsEditor] = useState(false)
  const [showQuestionEditor, setShowQuestionEditor] = useState(false)
  const [showQuestionImporter, setShowQuestionImporter] = useState(false)

  if (showSubjectsEditor) {
    return (
      <SubjectsEditor
        onBack={() => setShowSubjectsEditor(false)}
      />
    )
  }

  if (showQuestionEditor) {
    return (
      <QuestionEditor
        onBack={() => setShowQuestionEditor(false)}
      />
    )
  }

  if (showQuestionImporter) {
    return (
      <QuestionImporter
        onBack={() => setShowQuestionImporter(false)}
      />
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