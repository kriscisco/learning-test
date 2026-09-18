import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import './TopicsEditor.css'

function TopicsEditor({ onBack }) {
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [topics, setTopics] = useState([])

  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [saving, setSaving] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingTopic, setEditingTopic] = useState(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  const loadSubjects = async () => {
    setLoadingSubjects(true)

    const { data, error } = await supabase
      .from('subjects')
      .select('id, name, is_active')
      .order('name')

    setLoadingSubjects(false)

    if (error) {
      console.error('Gagal mengambil mata pelajaran:', error)
      alert('Mata pelajaran belum dapat dimuat.')
      return
    }

    setSubjects(data || [])

    if (!selectedSubject && data?.length > 0) {
      setSelectedSubject(data[0])
    }
  }

  const loadTopics = async (subjectId) => {
    if (!subjectId) {
      setTopics([])
      return
    }

    setLoadingTopics(true)

    const { data, error } = await supabase
      .from('topics')
      .select('id, subject_id, name, description, is_active, created_at')
      .eq('subject_id', subjectId)
      .order('name')

    setLoadingTopics(false)

    if (error) {
      console.error('Gagal mengambil topik:', error)
      alert('Topik belum dapat dimuat.')
      return
    }

    setTopics(data || [])
  }

  useEffect(() => {
    loadSubjects()
  }, [])

  useEffect(() => {
    if (selectedSubject) {
      loadTopics(selectedSubject.id)
    }
  }, [selectedSubject])

  const resetForm = () => {
    setName('')
    setDescription('')
    setIsActive(true)
    setEditingTopic(null)
    setShowForm(false)
  }

  const handleAdd = () => {
    setName('')
    setDescription('')
    setIsActive(true)
    setEditingTopic(null)
    setShowForm(true)
  }

  const handleEdit = (topic) => {
    setEditingTopic(topic)
    setName(topic.name)
    setDescription(topic.description || '')
    setIsActive(topic.is_active)
    setShowForm(true)
  }

  const handleSave = async (event) => {
    event.preventDefault()

    const cleanName = name.trim()
    const cleanDescription = description.trim()

    if (!cleanName || !selectedSubject || saving) return

    setSaving(true)

    if (editingTopic) {
      const { error } = await supabase
        .from('topics')
        .update({
          name: cleanName,
          description: cleanDescription || null,
          is_active: isActive,
        })
        .eq('id', editingTopic.id)

      setSaving(false)

      if (error) {
        console.error('Gagal memperbarui topik:', error)
        alert('Topik belum dapat diperbarui.')
        return
      }
    } else {
      const { error } = await supabase
        .from('topics')
        .insert({
          subject_id: selectedSubject.id,
          name: cleanName,
          description: cleanDescription || null,
          is_active: isActive,
        })

      setSaving(false)

      if (error) {
        console.error('Gagal menambahkan topik:', error)
        alert('Topik belum dapat ditambahkan.')
        return
      }
    }

    resetForm()
    await loadTopics(selectedSubject.id)
  }

  const handleToggleActive = async (topic) => {
    const { error } = await supabase
      .from('topics')
      .update({
        is_active: !topic.is_active,
      })
      .eq('id', topic.id)

    if (error) {
      console.error('Gagal mengubah status topik:', error)
      alert('Status topik belum dapat diubah.')
      return
    }

    await loadTopics(selectedSubject.id)
  }

  const handleDelete = async (topic) => {
    const confirmed = window.confirm(
      `Hapus topik "${topic.name}"?\n\nTopik yang dihapus tidak dapat dikembalikan.`
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', topic.id)

    if (error) {
      console.error('Gagal menghapus topik:', error)
      alert(
        'Topik belum dapat dihapus. Pastikan tidak ada data yang terkait.'
      )
      return
    }

    await loadTopics(selectedSubject.id)
  }

  return (
    <div className="topics-page">
      <header className="topics-header">
        <div>
          <p className="topics-eyebrow">
            ADMIN • TOPIK PEMBELAJARAN
          </p>

          <h1>Topik Pembelajaran</h1>

          <p className="topics-subtitle">
            Kelola topik di dalam setiap mata pelajaran.
          </p>
        </div>

        <button
          className="topics-back-button"
          type="button"
          onClick={onBack}
        >
          ← Kembali
        </button>
      </header>

      <main className="topics-content">
        <section className="topics-subject-selector">
          <div>
            <p className="topics-eyebrow">MATA PELAJARAN</p>

            <h2>Pilih Mata Pelajaran</h2>
          </div>

          {loadingSubjects ? (
            <div className="topics-loading-small">
              Memuat mata pelajaran...
            </div>
          ) : subjects.length === 0 ? (
            <div className="topics-empty-small">
              Belum ada mata pelajaran.
            </div>
          ) : (
            <div className="topics-subject-list">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  className={`topics-subject-button ${
                    selectedSubject?.id === subject.id
                      ? 'selected'
                      : ''
                  }`}
                  type="button"
                  onClick={() => {
                    setSelectedSubject(subject)
                    resetForm()
                  }}
                >
                  <span className="topics-subject-icon">
                    {subject.name.charAt(0).toUpperCase()}
                  </span>

                  <span>{subject.name}</span>

                  {!subject.is_active && (
                    <small>Nonaktif</small>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {selectedSubject && (
          <>
            <section className="topics-toolbar">
              <div>
                <span>Topik untuk</span>

                <strong>{selectedSubject.name}</strong>

                <small>
                  {topics.length} topik
                </small>
              </div>

              <button
                className="topics-add-button"
                type="button"
                onClick={handleAdd}
              >
                + Tambah Topik
              </button>
            </section>

            {showForm && (
              <section className="topics-form-card">
                <div className="topics-form-header">
                  <div>
                    <p className="topics-eyebrow">
                      {editingTopic
                        ? 'EDIT DATA'
                        : 'DATA BARU'}
                    </p>

                    <h2>
                      {editingTopic
                        ? 'Edit Topik'
                        : 'Tambah Topik'}
                    </h2>
                  </div>

                  <button
                    className="topics-close-button"
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSave}>
                  <div className="topics-form-grid">
                    <label>
                      Nama Topik
                      <input
                        type="text"
                        value={name}
                        onChange={(event) =>
                          setName(event.target.value)
                        }
                        placeholder="Contoh: Pecahan"
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
                        placeholder="Contoh: Operasi hitung pecahan"
                      />
                    </label>
                  </div>

                  <label className="topics-active-option">
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
                        Topik dapat digunakan oleh peserta.
                      </small>
                    </span>
                  </label>

                  <div className="topics-form-actions">
                    <button
                      className="topics-cancel-button"
                      type="button"
                      onClick={resetForm}
                      disabled={saving}
                    >
                      Batal
                    </button>

                    <button
                      className="topics-save-button"
                      type="submit"
                      disabled={!name.trim() || saving}
                    >
                      {saving
                        ? 'Menyimpan...'
                        : editingTopic
                          ? 'Simpan Perubahan'
                          : 'Tambah Topik'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="topics-list-card">
              <div className="topics-list-header">
                <div>
                  <p className="topics-eyebrow">DAFTAR TOPIK</p>

                  <h2>{selectedSubject.name}</h2>
                </div>
              </div>

              {loadingTopics ? (
                <div className="topics-loading">
                  Memuat topik...
                </div>
              ) : topics.length === 0 ? (
                <div className="topics-empty">
                  <div className="topics-empty-icon">+</div>

                  <h3>Belum ada topik</h3>

                  <p>
                    Tambahkan topik pertama untuk mata
                    pelajaran ini.
                  </p>

                  <button
                    className="topics-add-button"
                    type="button"
                    onClick={handleAdd}
                  >
                    + Tambah Topik
                  </button>
                </div>
              ) : (
                <div className="topics-table-wrapper">
                  <table className="topics-table">
                    <thead>
                      <tr>
                        <th>Topik</th>
                        <th>Deskripsi</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>

                    <tbody>
                      {topics.map((topic) => (
                        <tr key={topic.id}>
                          <td>
                            <div className="topic-name-cell">
                              <div className="topic-list-icon">
                                {topic.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <strong>{topic.name}</strong>
                            </div>
                          </td>

                          <td>
                            <span className="topic-description">
                              {topic.description || '—'}
                            </span>
                          </td>

                          <td>
                            <button
                              className={`topic-status ${
                                topic.is_active
                                  ? 'active'
                                  : 'inactive'
                              }`}
                              type="button"
                              onClick={() =>
                                handleToggleActive(topic)
                              }
                            >
                              {topic.is_active
                                ? 'Aktif'
                                : 'Nonaktif'}
                            </button>
                          </td>

                          <td>
                            <div className="topic-actions">
                              <button
                                className="topic-edit-button"
                                type="button"
                                onClick={() =>
                                  handleEdit(topic)
                                }
                              >
                                Edit
                              </button>

                              <button
                                className="topic-delete-button"
                                type="button"
                                onClick={() =>
                                  handleDelete(topic)
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
          </>
        )}
      </main>
    </div>
  )
}

export default TopicsEditor