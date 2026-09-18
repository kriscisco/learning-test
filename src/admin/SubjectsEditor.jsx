import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import TopicsEditor from './TopicsEditor'
import './SubjectsEditor.css'

function SubjectsEditor({ onBack }) {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const [showTopicsEditor, setShowTopicsEditor] = useState(false)
  const [selectedSubjectForTopics, setSelectedSubjectForTopics] =
    useState(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  const loadSubjects = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('subjects')
      .select('id, name, description, is_active, created_at')
      .order('name')

    setLoading(false)

    if (error) {
      console.error('Gagal mengambil mata pelajaran:', error)
      alert('Data mata pelajaran belum dapat dimuat.')
      return
    }

    setSubjects(data || [])
  }

  useEffect(() => {
    loadSubjects()
  }, [])

  const resetForm = () => {
    setName('')
    setDescription('')
    setIsActive(true)
    setEditingSubject(null)
    setShowForm(false)
  }

  const handleAdd = () => {
    setName('')
    setDescription('')
    setIsActive(true)
    setEditingSubject(null)
    setShowForm(true)
  }

  const handleEdit = (subject) => {
    setEditingSubject(subject)
    setName(subject.name)
    setDescription(subject.description || '')
    setIsActive(subject.is_active)
    setShowForm(true)
  }

  const handleSave = async (event) => {
    event.preventDefault()

    const cleanName = name.trim()
    const cleanDescription = description.trim()

    if (!cleanName || saving) return

    setSaving(true)

    if (editingSubject) {
      const { error } = await supabase
        .from('subjects')
        .update({
          name: cleanName,
          description: cleanDescription || null,
          is_active: isActive,
        })
        .eq('id', editingSubject.id)

      setSaving(false)

      if (error) {
        console.error('Gagal memperbarui mata pelajaran:', error)
        alert('Mata pelajaran belum dapat diperbarui.')
        return
      }
    } else {
      const { error } = await supabase
        .from('subjects')
        .insert({
          name: cleanName,
          description: cleanDescription || null,
          is_active: isActive,
        })

      setSaving(false)

      if (error) {
        console.error('Gagal menambahkan mata pelajaran:', error)
        alert('Mata pelajaran belum dapat ditambahkan.')
        return
      }
    }

    resetForm()
    await loadSubjects()
  }

  const handleToggleActive = async (subject) => {
    const { error } = await supabase
      .from('subjects')
      .update({
        is_active: !subject.is_active,
      })
      .eq('id', subject.id)

    if (error) {
      console.error('Gagal mengubah status:', error)
      alert('Status mata pelajaran belum dapat diubah.')
      return
    }

    await loadSubjects()
  }

  const handleDelete = async (subject) => {
    const confirmed = window.confirm(
      `Hapus mata pelajaran "${subject.name}"?\n\nData topik yang terkait juga akan ikut terhapus.`
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', subject.id)

    if (error) {
      console.error('Gagal menghapus mata pelajaran:', error)
      alert(
        'Mata pelajaran belum dapat dihapus. Pastikan tidak ada data yang menghalangi penghapusan.'
      )
      return
    }

    await loadSubjects()
  }

  const handleOpenTopics = (subject) => {
    setSelectedSubjectForTopics(subject)
    setShowTopicsEditor(true)
  }

  if (showTopicsEditor) {
    return (
      <TopicsEditor
        initialSubjectId={selectedSubjectForTopics?.id}
        onBack={() => {
          setShowTopicsEditor(false)
          setSelectedSubjectForTopics(null)
        }}
      />
    )
  }

  return (
    <div className="subjects-page">
      <header className="subjects-header">
        <div>
          <p className="subjects-eyebrow">
            ADMIN • MATA PELAJARAN
          </p>

          <h1>Mata Pelajaran</h1>

          <p className="subjects-subtitle">
            Kelola daftar mata pelajaran yang tersedia untuk peserta.
          </p>
        </div>

        <button
          className="subjects-back-button"
          type="button"
          onClick={onBack}
        >
          ← Kembali
        </button>
      </header>

      <main className="subjects-content">
        <section className="subjects-toolbar">
          <div>
            <strong>{subjects.length}</strong>
            <span> mata pelajaran</span>
          </div>

          <button
            className="subjects-add-button"
            type="button"
            onClick={handleAdd}
          >
            + Tambah Mata Pelajaran
          </button>
        </section>

        {showForm && (
          <section className="subjects-form-card">
            <div className="subjects-form-header">
              <div>
                <p className="subjects-eyebrow">
                  {editingSubject ? 'EDIT DATA' : 'DATA BARU'}
                </p>

                <h2>
                  {editingSubject
                    ? 'Edit Mata Pelajaran'
                    : 'Tambah Mata Pelajaran'}
                </h2>
              </div>

              <button
                className="subjects-close-button"
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="subjects-form-grid">
                <label>
                  Nama Mata Pelajaran

                  <input
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Contoh: Matematika"
                    autoFocus
                    required
                  />
                </label>

                <label>
                  Deskripsi

                  <input
                    type="text"
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    placeholder="Contoh: Latihan soal Matematika"
                  />
                </label>
              </div>

              <label className="subjects-active-option">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) =>
                    setIsActive(event.target.checked)
                  }
                />

                <span>
                  <strong>Aktif</strong>

                  <small>
                    Mata pelajaran dapat dipilih oleh peserta.
                  </small>
                </span>
              </label>

              <div className="subjects-form-actions">
                <button
                  className="subjects-cancel-button"
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Batal
                </button>

                <button
                  className="subjects-save-button"
                  type="submit"
                  disabled={!name.trim() || saving}
                >
                  {saving
                    ? 'Menyimpan...'
                    : editingSubject
                      ? 'Simpan Perubahan'
                      : 'Tambah Mata Pelajaran'}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="subjects-list-card">
          <div className="subjects-list-header">
            <div>
              <p className="subjects-eyebrow">DAFTAR</p>

              <h2>Semua Mata Pelajaran</h2>
            </div>
          </div>

          {loading ? (
            <div className="subjects-loading">
              Memuat mata pelajaran...
            </div>
          ) : subjects.length === 0 ? (
            <div className="subjects-empty">
              <div className="subjects-empty-icon">+</div>

              <h3>Belum ada mata pelajaran</h3>

              <p>
                Tambahkan mata pelajaran pertama untuk mulai
                membuat bank soal.
              </p>

              <button
                className="subjects-add-button"
                type="button"
                onClick={handleAdd}
              >
                + Tambah Mata Pelajaran
              </button>
            </div>
          ) : (
            <div className="subjects-table-wrapper">
              <table className="subjects-table">
                <thead>
                  <tr>
                    <th>Mata Pelajaran</th>
                    <th>Deskripsi</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {subjects.map((subject) => (
                    <tr key={subject.id}>
                      <td>
                        <div className="subject-name-cell">
                          <div className="subject-list-icon">
                            {subject.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <strong>{subject.name}</strong>
                        </div>
                      </td>

                      <td>
                        <span className="subject-description">
                          {subject.description || '—'}
                        </span>
                      </td>

                      <td>
                        <button
                          className={`subject-status ${
                            subject.is_active
                              ? 'active'
                              : 'inactive'
                          }`}
                          type="button"
                          onClick={() =>
                            handleToggleActive(subject)
                          }
                        >
                          {subject.is_active
                            ? 'Aktif'
                            : 'Nonaktif'}
                        </button>
                      </td>

                      <td>
                        <div className="subject-actions">
                          <button
                            className="subject-topic-button"
                            type="button"
                            onClick={() =>
                              handleOpenTopics(subject)
                            }
                          >
                            Topik
                          </button>

                          <button
                            className="subject-edit-button"
                            type="button"
                            onClick={() =>
                              handleEdit(subject)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="subject-delete-button"
                            type="button"
                            onClick={() =>
                              handleDelete(subject)
                            }
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default SubjectsEditor