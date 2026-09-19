import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import './QuestionEditor.css'

const emptyOptions = [
  { text: '', isCorrect: true },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
]

function QuestionEditor({ onBack }) {
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [questions, setQuestions] = useState([])

  const [loading, setLoading] = useState(true)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [showForm, setShowForm] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [questionText, setQuestionText] = useState('')
  const [explanation, setExplanation] = useState('')
  const [options, setOptions] = useState(emptyOptions)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    loadSubjects()
  }, [])

  useEffect(() => {
    if (selectedSubject) {
      loadQuestions(selectedSubject)
    } else {
      setQuestions([])
    }
  }, [selectedSubject])

  async function loadSubjects() {
    setLoading(true)
    setError('')

    const { data, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name, is_active')
      .order('name', { ascending: true })

    if (subjectError) {
      setError(subjectError.message)
      setLoading(false)
      return
    }

    setSubjects(data || [])

    const firstActive = (data || []).find(
      (subject) => subject.is_active
    )

    if (firstActive) {
      setSelectedSubject(firstActive.id)
    }

    setLoading(false)
  }

  async function loadQuestions(subjectId) {
    setLoadingQuestions(true)
    setError('')

    const { data, error: questionError } = await supabase
      .from('questions')
      .select(`
        id,
        question_text,
        explanation,
        difficulty,
        is_active,
        image_url,
        question_options (
          id,
          option_text,
          is_correct,
          option_order
        )
      `)
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false })

    if (questionError) {
      setError(questionError.message)
      setQuestions([])
      setLoadingQuestions(false)
      return
    }

    const formattedQuestions = (data || []).map((question) => ({
      ...question,
      question_options: [...(question.question_options || [])].sort(
        (a, b) => a.option_order - b.option_order
      ),
    }))

    setQuestions(formattedQuestions)
    setLoadingQuestions(false)
  }

  function resetForm() {
    setEditingQuestionId(null)
    setQuestionText('')
    setExplanation('')
    setOptions(emptyOptions.map((option) => ({ ...option })))
    setIsActive(true)
    setError('')
  }

  function openAddForm() {
    resetForm()
    setSuccess('')
    setShowForm(true)
  }

  function openEditForm(question) {
    setError('')
    setSuccess('')
    setEditingQuestionId(question.id)
    setQuestionText(question.question_text || '')
    setExplanation(question.explanation || '')
    setIsActive(question.is_active ?? true)

    if (question.question_options && question.question_options.length > 0) {
      const sorted = [...question.question_options].sort(
        (a, b) => a.option_order - b.option_order
      )
      const mapped = sorted.map((opt) => ({
        id: opt.id,
        text: opt.option_text || '',
        isCorrect: Boolean(opt.is_correct),
      }))
      while (mapped.length < 4) {
        mapped.push({ text: '', isCorrect: false })
      }
      setOptions(mapped)
    } else {
      setOptions(emptyOptions.map((option) => ({ ...option })))
    }

    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleDeleteQuestion(questionId) {
    const target = questions.find((q) => q.id === questionId)
    const snippet = target?.question_text
      ? `\n\n"${target.question_text.slice(0, 70)}${target.question_text.length > 70 ? '...' : ''}"`
      : ''

    const confirmed = window.confirm(
      `Hapus soal ini secara permanen?${snippet}\n\nSoal dan pilihan jawaban akan dihapus.`
    )
    if (!confirmed) return

    setDeletingId(questionId)
    setError('')
    setSuccess('')

    try {
      // 1. Hapus test_answers terkait jika ada agar tidak melanggar foreign key
      await supabase
        .from('test_answers')
        .delete()
        .eq('question_id', questionId)

      // 2. Hapus pilihan jawaban
      await supabase
        .from('question_options')
        .delete()
        .eq('question_id', questionId)

      // 3. Hapus soal
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

      if (deleteError) {
        setError(`Gagal menghapus soal: ${deleteError.message}`)
        setDeletingId(null)
        return
      }

      if (editingQuestionId === questionId) {
        resetForm()
        setShowForm(false)
      }

      setSuccess('Soal berhasil dihapus.')
      await loadQuestions(selectedSubject)
    } catch (err) {
      console.error('Gagal menghapus soal:', err)
      setError('Terjadi kendala saat menghapus soal.')
    } finally {
      setDeletingId(null)
    }
  }

  function closeForm() {
    if (saving) return

    resetForm()
    setShowForm(false)
  }

  function updateOption(index, value) {
    setOptions((currentOptions) =>
      currentOptions.map((option, optionIndex) =>
        optionIndex === index
          ? { ...option, text: value }
          : option
      )
    )
  }

  function setCorrectOption(index) {
    setOptions((currentOptions) =>
      currentOptions.map((option, optionIndex) => ({
        ...option,
        isCorrect: optionIndex === index,
      }))
    )
  }

  async function handleSaveQuestion(event) {
    event.preventDefault()

    setError('')
    setSuccess('')

    const cleanQuestion = questionText.trim()
    const cleanExplanation = explanation.trim()

    if (!selectedSubject) {
      setError('Silakan pilih mata pelajaran terlebih dahulu.')
      return
    }

    if (!cleanQuestion) {
      setError('Pertanyaan belum diisi.')
      return
    }

    const cleanOptions = options.map((option) => ({
      ...option,
      text: option.text.trim(),
    }))

    const emptyOption = cleanOptions.find(
      (option) => !option.text
    )

    if (emptyOption) {
      setError('Semua pilihan A sampai D harus diisi.')
      return
    }

    const correctOptions = cleanOptions.filter(
      (option) => option.isCorrect
    )

    if (correctOptions.length !== 1) {
      setError('Pilih tepat satu jawaban yang benar.')
      return
    }

    setSaving(true)

    if (editingQuestionId) {
      // 1. Update tabel questions
      const { error: updateQuestionError } = await supabase
        .from('questions')
        .update({
          question_text: cleanQuestion,
          explanation: cleanExplanation || null,
          is_active: isActive,
        })
        .eq('id', editingQuestionId)

      if (updateQuestionError) {
        setError(`Gagal memperbarui soal: ${updateQuestionError.message}`)
        setSaving(false)
        return
      }

      // 2. Update opsi jawaban (mempertahankan ID untuk integritas relasi)
      let hasOptionError = false
      for (let i = 0; i < cleanOptions.length; i++) {
        const opt = cleanOptions[i]
        if (opt.id) {
          const { error: updErr } = await supabase
            .from('question_options')
            .update({
              option_text: opt.text,
              is_correct: opt.isCorrect,
              option_order: i + 1,
            })
            .eq('id', opt.id)

          if (updErr) {
            console.error('Error updating option:', updErr)
            hasOptionError = true
          }
        } else {
          const { error: insErr } = await supabase
            .from('question_options')
            .insert({
              question_id: editingQuestionId,
              option_text: opt.text,
              is_correct: opt.isCorrect,
              option_order: i + 1,
            })

          if (insErr) {
            console.error('Error inserting option:', insErr)
            hasOptionError = true
          }
        }
      }

      if (hasOptionError) {
        setError('Sebagian pilihan jawaban mungkin belum tersimpan dengan sempurna.')
        setSaving(false)
        return
      }

      resetForm()
      setShowForm(false)
      setSuccess('Soal berhasil diperbarui.')

      await loadQuestions(selectedSubject)

      setSaving(false)
    } else {
      const { data: question, error: insertQuestionError } =
        await supabase
          .from('questions')
          .insert({
            subject_id: selectedSubject,
            question_text: cleanQuestion,
            explanation: cleanExplanation || null,
            difficulty: 'medium',
            is_active: isActive,
          })
          .select('id')
          .single()

      if (insertQuestionError) {
        setError(insertQuestionError.message)
        setSaving(false)
        return
      }

      const optionRows = cleanOptions.map((option, index) => ({
        question_id: question.id,
        option_text: option.text,
        is_correct: option.isCorrect,
        option_order: index + 1,
      }))

      const { error: insertOptionsError } = await supabase
        .from('question_options')
        .insert(optionRows)

      if (insertOptionsError) {
        await supabase
          .from('questions')
          .delete()
          .eq('id', question.id)

        setError(insertOptionsError.message)
        setSaving(false)
        return
      }

      resetForm()
      setShowForm(false)
      setSuccess('Soal berhasil ditambahkan.')

      await loadQuestions(selectedSubject)

      setSaving(false)
    }
  }

  function getDifficultyLabel(difficulty) {
    if (difficulty === 'easy') return 'Mudah'
    if (difficulty === 'hard') return 'Sulit'
    return 'Sedang'
  }

  function getOptionLetter(index) {
    return String.fromCharCode(65 + index)
  }

  const selectedSubjectData = subjects.find(
    (subject) => subject.id === selectedSubject
  )

  return (
    <div className="question-editor">
      <div className="question-editor-header">
        <div>
          <button
            className="question-back-button"
            onClick={onBack}
          >
            ← Kembali
          </button>

          <h2>Editor Soal</h2>

          <p>
            Kelola soal dan pilihan jawaban berdasarkan mata pelajaran.
          </p>
        </div>

        {!showForm && (
          <button
            className="question-add-button"
            onClick={openAddForm}
          >
            + Tambah Soal
          </button>
        )}
      </div>

      <div className="question-editor-toolbar">
        <label htmlFor="subject-select">
          Mata Pelajaran
        </label>

        {loading ? (
          <div className="question-loading-small">
            Memuat mata pelajaran...
          </div>
        ) : (
          <select
            id="subject-select"
            value={selectedSubject}
            onChange={(event) => {
              setSelectedSubject(event.target.value)
              setShowForm(false)
              setSuccess('')
              setError('')
            }}
          >
            <option value="">Pilih mata pelajaran</option>

            {subjects.map((subject) => (
              <option
                key={subject.id}
                value={subject.id}
                disabled={!subject.is_active}
              >
                {subject.name}
                {!subject.is_active ? ' (Nonaktif)' : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="question-error">
          <strong>Terjadi kesalahan:</strong> {error}
        </div>
      )}

      {success && (
        <div className="question-success">
          ✓ {success}
        </div>
      )}

      {showForm && (
        <form
          className="question-form"
          onSubmit={handleSaveQuestion}
        >
          <div className="question-form-header">
            <div>
              <h3>{editingQuestionId ? 'Edit Soal' : 'Tambah Soal'}</h3>

              <p>
                Mata Pelajaran:{' '}
                <strong>
                  {selectedSubjectData?.name || '-'}
                </strong>
              </p>
            </div>
          </div>

          <div className="question-form-group">
            <label htmlFor="question-text">
              Pertanyaan
            </label>

            <textarea
              id="question-text"
              value={questionText}
              onChange={(event) =>
                setQuestionText(event.target.value)
              }
              placeholder="Tulis pertanyaan di sini..."
              rows={5}
              disabled={saving}
            />
          </div>

          <div className="question-form-group">
            <div className="question-options-heading">
              <div>
                <label>Pilihan Jawaban</label>

                <p>
                  Pilih satu jawaban sebagai kunci jawaban.
                </p>
              </div>
            </div>

            <div className="question-form-options">
              {options.map((option, index) => (
                <div
                  className={`question-form-option ${
                    option.isCorrect ? 'selected' : ''
                  }`}
                  key={index}
                >
                  <button
                    type="button"
                    className="question-correct-radio"
                    onClick={() => setCorrectOption(index)}
                    disabled={saving}
                    aria-label={`Jadikan pilihan ${getOptionLetter(index)} sebagai jawaban benar`}
                  >
                    {option.isCorrect ? '✓' : ''}
                  </button>

                  <span className="question-form-letter">
                    {getOptionLetter(index)}
                  </span>

                  <input
                    type="text"
                    value={option.text}
                    onChange={(event) =>
                      updateOption(index, event.target.value)
                    }
                    placeholder={`Pilihan ${getOptionLetter(index)}`}
                    disabled={saving}
                  />

                  {option.isCorrect && (
                    <span className="question-answer-label">
                      Kunci
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="question-form-group">
            <label htmlFor="question-explanation">
              Penjelasan Jawaban
              <span className="question-optional">
                (opsional)
              </span>
            </label>

            <textarea
              id="question-explanation"
              value={explanation}
              onChange={(event) =>
                setExplanation(event.target.value)
              }
              placeholder="Tulis penjelasan jawaban jika diperlukan..."
              rows={4}
              disabled={saving}
            />
          </div>

          <div className="question-form-group">
            <label>
              Status Soal
            </label>

            <label className="question-active-toggle">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) =>
                  setIsActive(event.target.checked)
                }
                disabled={saving}
              />

              <span>
                Soal aktif dan dapat digunakan dalam tes
              </span>
            </label>
          </div>

          <div className="question-form-note">
            <strong>Tingkat kesulitan:</strong>{' '}
            akan dianalisis otomatis oleh sistem. Admin tidak perlu
            menentukan tingkat kesulitan secara manual.
          </div>

          <div className="question-form-actions">
            <button
              type="button"
              className="question-cancel-button"
              onClick={closeForm}
              disabled={saving}
            >
              Batal
            </button>

            <button
              type="submit"
              className="question-save-button"
              disabled={saving}
            >
              {saving
                ? (editingQuestionId ? 'Menyimpan Perubahan...' : 'Menyimpan...')
                : (editingQuestionId ? 'Simpan Perubahan' : 'Simpan Soal')}
            </button>
          </div>
        </form>
      )}

      {!selectedSubject && !loading && !showForm && (
        <div className="question-empty">
          <div className="question-empty-icon">📝</div>

          <h3>Pilih Mata Pelajaran</h3>

          <p>
            Pilih mata pelajaran terlebih dahulu untuk melihat soal.
          </p>
        </div>
      )}

      {selectedSubject && !showForm && (
        <div className="question-list-section">
          <div className="question-list-header">
            <div>
              <h3>
                {selectedSubjectData?.name || 'Mata Pelajaran'}
              </h3>

              <p>
                {questions.length} soal tersedia
              </p>
            </div>
          </div>

          {loadingQuestions ? (
            <div className="question-loading">
              Memuat soal...
            </div>
          ) : questions.length === 0 ? (
            <div className="question-empty">
              <div className="question-empty-icon">📚</div>

              <h3>Belum ada soal</h3>

              <p>
                Mata pelajaran ini belum memiliki soal.
              </p>

              <button
                className="question-add-button"
                onClick={openAddForm}
              >
                + Tambah Soal Pertama
              </button>
            </div>
          ) : (
            <div className="question-list">
              {questions.map((question, index) => (
                <article
                  className={`question-card ${
                    !question.is_active ? 'is-inactive' : ''
                  }`}
                  key={question.id}
                >
                  <div className="question-card-top">
                    <div className="question-number">
                      Soal {questions.length - index}
                    </div>

                    <div className="question-card-actions">
                      <span
                        className={`question-status ${
                          question.is_active
                            ? 'active'
                            : 'inactive'
                        }`}
                      >
                        {question.is_active
                          ? 'Aktif'
                          : 'Nonaktif'}
                      </span>

                      <button
                        type="button"
                        className="question-edit-button"
                        onClick={() => openEditForm(question)}
                        disabled={deletingId === question.id || saving}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="question-delete-button"
                        onClick={() => handleDeleteQuestion(question.id)}
                        disabled={deletingId === question.id || saving}
                      >
                        {deletingId === question.id ? 'Menghapus...' : 'Hapus'}
                      </button>
                    </div>
                  </div>

                  <div className="question-text">
                    {question.question_text}
                  </div>

                  <div className="question-meta">
                    <span>
                      Tingkat:{' '}
                      {getDifficultyLabel(
                        question.difficulty
                      )}
                    </span>

                    <span>
                      {question.question_options?.length || 0}{' '}
                      pilihan
                    </span>
                  </div>

                  {question.question_options?.length > 0 && (
                    <div className="question-options">
                      {question.question_options.map(
                        (option, optionIndex) => (
                          <div
                            className={`question-option ${
                              option.is_correct
                                ? 'correct'
                                : ''
                            }`}
                            key={option.id}
                          >
                            <span className="question-option-letter">
                              {getOptionLetter(optionIndex)}
                            </span>

                            <span className="question-option-text">
                              {option.option_text}
                            </span>

                            {option.is_correct && (
                              <span className="question-correct-label">
                                ✓ Kunci
                              </span>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {question.explanation && (
                    <div className="question-explanation">
                      <strong>Penjelasan:</strong>{' '}
                      {question.explanation}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default QuestionEditor