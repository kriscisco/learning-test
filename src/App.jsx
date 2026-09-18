import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Admin from './admin/Admin'
import './App.css'

function shuffleArray(array) {
  const result = [...array]

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

function normalizeQuestionText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\s.,!?;:]+$/g, '')
}

function App() {
  const [name, setName] = useState('')
  const [userId, setUserId] = useState(null)

  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [selectedCount, setSelectedCount] = useState(10)
  const [mode, setMode] = useState('practice')

  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showFeedback, setShowFeedback] = useState(false)

  const [result, setResult] = useState(null)
  const [testStartedAt, setTestStartedAt] = useState(null)

  const [showSubjects, setShowSubjects] = useState(false)
  const [showTestSetup, setShowTestSetup] = useState(false)
  const [showTest, setShowTest] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)

  const [loading, setLoading] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [savingResult, setSavingResult] = useState(false)

  const handleStart = async () => {
    const cleanName = name.trim()

    if (!cleanName || loading) return

    setLoading(true)

    const { data, error } = await supabase
      .from('users')
      .insert({
        name: cleanName,
      })
      .select('id, name')
      .single()

    setLoading(false)

    if (error) {
      console.error('Gagal menyimpan peserta:', error)
      alert('Nama belum dapat disimpan. Silakan coba lagi.')
      return
    }

    setUserId(data.id)
    setName(data.name)
    setShowSubjects(true)
  }

  useEffect(() => {
    if (!showSubjects) return

    const loadSubjects = async () => {
      setLoadingSubjects(true)

      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name')

      setLoadingSubjects(false)

      if (error) {
        console.error('Gagal mengambil mata pelajaran:', error)
        alert('Mata pelajaran belum dapat dimuat.')
        return
      }

      setSubjects(data || [])
    }

    loadSubjects()
  }, [showSubjects])

  const handleSelectSubject = async (subject) => {
    setSelectedSubject(subject)
    setLoadingQuestions(true)

    const { count, error } = await supabase
      .from('questions')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('subject_id', subject.id)
      .eq('is_active', true)

    setLoadingQuestions(false)

    if (error) {
      console.error('Gagal menghitung soal:', error)
      alert('Jumlah soal belum dapat diperiksa.')
      return
    }

    const total = count || 0

    setQuestionCount(total)

    if (total > 0) {
      setSelectedCount(Math.min(10, total))
    } else {
      setSelectedCount(0)
    }

    setShowTestSetup(true)
  }

  const handleBackToSubjects = () => {
    setShowTestSetup(false)
    setSelectedSubject(null)
    setQuestionCount(0)
  }

  const handleBeginTest = async () => {
    if (!selectedSubject || selectedCount < 1 || loadingQuestions) {
      return
    }

    setLoadingQuestions(true)

    const { data, error } = await supabase
      .from('questions')
      .select(`
        id,
        question_text,
        explanation,
        image_url,
        question_options (
          id,
          option_text,
          is_correct,
          option_order
        )
      `)
      .eq('subject_id', selectedSubject.id)
      .eq('is_active', true)

    setLoadingQuestions(false)

    if (error) {
      console.error('Gagal mengambil soal:', error)
      alert('Soal belum dapat dimuat. Silakan coba lagi.')
      return
    }

    if (!data || data.length === 0) {
      alert('Belum ada soal aktif untuk mata pelajaran ini.')
      return
    }

    const uniqueQuestions = []
    const seenQuestions = new Set()

    for (const question of data) {
      const normalizedText = normalizeQuestionText(
        question.question_text
      )

      if (!normalizedText || seenQuestions.has(normalizedText)) {
        continue
      }

      seenQuestions.add(normalizedText)
      uniqueQuestions.push(question)
    }

    if (uniqueQuestions.length < selectedCount) {
      alert(
        `Hanya tersedia ${uniqueQuestions.length} soal unik untuk mata pelajaran ini. Silakan pilih jumlah soal yang sesuai.`
      )
      setQuestionCount(uniqueQuestions.length)
      setSelectedCount(uniqueQuestions.length)
      return
    }

    const preparedQuestions = shuffleArray(uniqueQuestions)
      .slice(0, selectedCount)
      .map((question) => ({
        ...question,
        question_options: shuffleArray(
          question.question_options || []
        ),
      }))

    setQuestions(preparedQuestions)
    setCurrentQuestionIndex(0)
    setAnswers({})
    setShowFeedback(false)
    setResult(null)
    setTestStartedAt(new Date().toISOString())

    setShowTestSetup(false)
    setShowTest(true)
  }

  const handleSelectAnswer = (optionId) => {
    if (showFeedback) return

    const currentQuestion = questions[currentQuestionIndex]

    if (!currentQuestion) return

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: optionId,
    }))

    if (mode === 'practice') {
      setShowFeedback(true)
    }
  }

  const calculateResult = () => {
    let correct = 0

    questions.forEach((question) => {
      const selectedOptionId = answers[question.id]

      const correctOption = question.question_options?.find(
        (option) => option.is_correct
      )

      if (
        selectedOptionId &&
        correctOption &&
        selectedOptionId === correctOption.id
      ) {
        correct += 1
      }
    })

    const total = questions.length
    const wrong = total - correct
    const score = total > 0 ? (correct / total) * 100 : 0
    const passed = score >= 85

    const review = questions
      .map((question, index) => {
        const selectedOptionId = answers[question.id] || null
        const correctOption =
          question.question_options?.find(
            (option) => option.is_correct
          ) || null
        const selectedOption =
          question.question_options?.find(
            (option) => option.id === selectedOptionId
          ) || null
        const isCorrect =
          Boolean(selectedOptionId) &&
          Boolean(correctOption) &&
          selectedOptionId === correctOption.id

        if (isCorrect) return null

        return {
          number: index + 1,
          questionText: question.question_text,
          imageUrl: question.image_url || null,
          selectedOptionText: selectedOption?.option_text || 'Tidak dijawab',
          selectedOptionLabel: selectedOption
            ? String.fromCharCode(65 + (question.question_options || []).findIndex((option) => option.id === selectedOption.id))
            : null,
          correctOptionText: correctOption?.option_text || 'Kunci belum tersedia',
          correctOptionLabel: correctOption
            ? String.fromCharCode(65 + (question.question_options || []).findIndex((option) => option.id === correctOption.id))
            : null,
        }
      })
      .filter(Boolean)

    return {
      correct,
      wrong,
      total,
      score,
      passed,
      review,
    }
  }

  const handleNextQuestion = async () => {
    const currentQuestion = questions[currentQuestionIndex]

    if (!currentQuestion || savingResult) return

    if (!answers[currentQuestion.id]) {
      return
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((previous) => previous + 1)
      setShowFeedback(false)
      return
    }

    const finalResult = calculateResult()

    if (!userId || !selectedSubject) {
      alert('Data peserta atau mata pelajaran tidak ditemukan.')
      return
    }

    setSavingResult(true)

    const { data: sessionData, error: sessionError } = await supabase
      .from('test_sessions')
      .insert({
        user_id: userId,
        subject_id: selectedSubject.id,
        total_questions: finalResult.total,
        correct_answers: finalResult.correct,
        wrong_answers: finalResult.wrong,
        score: Number(finalResult.score.toFixed(2)),
        passed: finalResult.passed,
        started_at: testStartedAt || new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (sessionError || !sessionData) {
      console.error('Gagal menyimpan hasil tes:', sessionError)
      setSavingResult(false)
      alert(
        'Tes selesai, tetapi hasil belum berhasil disimpan. Silakan coba lagi.'
      )
      return
    }

    const testAnswers = questions.map((question) => {
      const selectedOptionId = answers[question.id] || null
      const correctOption =
        question.question_options?.find(
          (option) => option.is_correct
        ) || null

      return {
        test_session_id: sessionData.id,
        question_id: question.id,
        selected_option_id: selectedOptionId,
        correct_option_id: correctOption?.id || null,
        is_correct:
          Boolean(selectedOptionId) &&
          Boolean(correctOption) &&
          selectedOptionId === correctOption.id,
      }
    })

    const { error: answersError } = await supabase
      .from('test_answers')
      .insert(testAnswers)

    setSavingResult(false)

    if (answersError) {
      console.error(
        'Gagal menyimpan detail jawaban:',
        answersError
      )
      alert(
        'Nilai berhasil disimpan, tetapi detail jawaban belum lengkap.'
      )
    }

    setResult(finalResult)
    setShowTest(false)
    setShowResult(true)
  }

  const handleBackFromResult = () => {
    setShowResult(false)
    setShowSubjects(true)
    setSelectedSubject(null)
    setQuestionCount(0)
    setQuestions([])
    setAnswers({})
    setResult(null)
    setTestStartedAt(null)
  }

  const handleOpenAdmin = () => {
    setShowAdmin(true)
  }

  const handleBackFromAdmin = () => {
    setShowAdmin(false)
  }

  const getCurrentQuestion = () => {
    return questions[currentQuestionIndex] || null
  }

  const getSelectedOption = () => {
    const currentQuestion = getCurrentQuestion()

    if (!currentQuestion) return null

    const selectedOptionId = answers[currentQuestion.id]

    return (
      currentQuestion.question_options?.find(
        (option) => option.id === selectedOptionId
      ) || null
    )
  }

  const getCorrectOption = () => {
    const currentQuestion = getCurrentQuestion()

    if (!currentQuestion) return null

    return (
      currentQuestion.question_options?.find(
        (option) => option.is_correct
      ) || null
    )
  }

  if (showAdmin) {
    return <Admin onBack={handleBackFromAdmin} />
  }

  if (showResult && result) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">L</div>

            <div>
              <div className="brand-name">Learning Test</div>
              <div className="brand-subtitle">
                Latihan ulangan yang nyaman
              </div>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              onClick={handleOpenAdmin}
              style={{
                border: '1px solid #ccd3ce',
                background: '#fffdf8',
                color: '#496258',
                borderRadius: '10px',
                padding: '9px 13px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Admin
            </button>
          </div>
        </header>

        <main className="main-content">
          <section className="welcome-card">
            <div className="welcome-badge">
              HASIL TES
            </div>

            <h1>
              {result.passed ? (
                <>
                  Selamat, <span>{name.trim()}</span>!
                </>
              ) : (
                <>
                  Tetap semangat, <span>{name.trim()}</span>!
                </>
              )}
            </h1>

            <p className="welcome-text">
              Tes {selectedSubject?.name} telah selesai.
            </p>

            <div
              style={{
                textAlign: 'center',
                padding: '28px 10px',
                margin: '20px 0',
                border: '1px solid #dfe6e1',
                borderRadius: '18px',
                background: '#fffdf8',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#718078',
                  marginBottom: '8px',
                }}
              >
                NILAI
              </div>

              <div
                style={{
                  fontSize: '4rem',
                  lineHeight: 1,
                  fontWeight: 800,
                  color: result.passed
                    ? '#426b5a'
                    : '#9a6458',
                }}
              >
                {result.score.toFixed(0)}
              </div>

              <div
                style={{
                  marginTop: '12px',
                  fontWeight: 800,
                  color: result.passed
                    ? '#426b5a'
                    : '#9a6458',
                }}
              >
                {result.passed
                  ? 'LULUS'
                  : 'BELUM LULUS'}
              </div>
            </div>

            <div className="test-summary">
              <div>
                <span>Peserta</span>
                <strong>{name.trim()}</strong>
              </div>

              <div>
                <span>Mata pelajaran</span>
                <strong>{selectedSubject?.name}</strong>
              </div>

              <div>
                <span>Jumlah soal</span>
                <strong>{result.total}</strong>
              </div>

              <div>
                <span>Jawaban benar</span>
                <strong>{result.correct}</strong>
              </div>

              <div>
                <span>Jawaban salah</span>
                <strong>{result.wrong}</strong>
              </div>

              <div>
                <span>Batas lulus</span>
                <strong>85</strong>
              </div>
            </div>

            {!result.passed && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '15px 17px',
                  borderRadius: '12px',
                  background: '#f8f1e8',
                  color: '#735e4e',
                  lineHeight: 1.6,
                  fontSize: '0.92rem',
                }}
              >
                Nilaimu belum mencapai 85. Tidak apa-apa,
                kamu bisa mencoba lagi dan belajar dari soal
                yang sudah dikerjakan.
              </div>
            )}

            <div
              style={{
                marginTop: '28px',
                padding: '20px',
                borderRadius: '16px',
                background: '#f7f3eb',
                border: '1px solid #e1dbcf',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: '#35443e',
                    }}
                  >
                    Review Jawaban
                  </div>
                  <div
                    style={{
                      marginTop: '4px',
                      color: '#718078',
                      fontSize: '0.9rem',
                    }}
                  >
                    Hanya soal yang masih perlu dipelajari.
                  </div>
                </div>

                <div
                  style={{
                    flex: '0 0 auto',
                    padding: '7px 10px',
                    borderRadius: '999px',
                    background: '#fffdf8',
                    color: '#66766e',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                  }}
                >
                  {result.review?.length || 0} soal
                </div>
              </div>

              {result.review?.length ? (
                <div
                  style={{
                    display: 'grid',
                    gap: '14px',
                  }}
                >
                  {result.review.map((item) => (
                    <article
                      key={`${item.number}-${item.questionText}`}
                      style={{
                        padding: '17px',
                        borderRadius: '14px',
                        background: '#fffdf8',
                        border: '1px solid #dedfd9',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          color: '#668879',
                          marginBottom: '8px',
                        }}
                      >
                        SOAL {item.number}
                      </div>

                      <div
                        style={{
                          color: '#35443e',
                          fontWeight: 700,
                          lineHeight: 1.6,
                        }}
                      >
                        {item.questionText}
                      </div>

                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt="Ilustrasi soal"
                          style={{
                            display: 'block',
                            width: '100%',
                            maxHeight: '260px',
                            objectFit: 'contain',
                            margin: '14px 0',
                            borderRadius: '10px',
                          }}
                        />
                      )}

                      <div
                        style={{
                          marginTop: '13px',
                          padding: '11px 12px',
                          borderRadius: '10px',
                          background: '#faf0ed',
                          color: '#8f5d52',
                          lineHeight: 1.5,
                        }}
                      >
                        <strong>Jawaban kamu:</strong>{' '}
                        {item.selectedOptionLabel
                          ? `${item.selectedOptionLabel}. `
                          : ''}
                        {item.selectedOptionText} ❌
                      </div>

                      <div
                        style={{
                          marginTop: '9px',
                          padding: '11px 12px',
                          borderRadius: '10px',
                          background: '#edf5f0',
                          color: '#426b5a',
                          lineHeight: 1.5,
                        }}
                      >
                        <strong>Jawaban benar:</strong>{' '}
                        {item.correctOptionLabel
                          ? `${item.correctOptionLabel}. `
                          : ''}
                        {item.correctOptionText} ✓
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: '15px',
                    borderRadius: '12px',
                    background: '#edf5f0',
                    color: '#426b5a',
                    lineHeight: 1.6,
                  }}
                >
                  🎉 Semua jawaban benar! Tidak ada soal yang perlu direview.
                </div>
              )}
            </div>

            <button
              className="primary-button"
              type="button"
              onClick={handleBackFromResult}
              style={{ marginTop: '24px' }}
            >
              Kembali ke Mata Pelajaran
              <span>→</span>
            </button>
          </section>
        </main>

        <footer className="footer">
          <span>Learning Test</span>
          <span>•</span>
          <span>
            Belajar sedikit demi sedikit setiap hari.
          </span>
        </footer>
      </div>
    )
  }

  if (showTest) {
    const currentQuestion = getCurrentQuestion()
    const selectedOption = getSelectedOption()
    const correctOption = getCorrectOption()

    if (!currentQuestion) {
      return null
    }

    const isCorrect =
      selectedOption &&
      correctOption &&
      selectedOption.id === correctOption.id

    const progress =
      ((currentQuestionIndex + 1) / questions.length) * 100

    return (
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">L</div>

            <div>
              <div className="brand-name">Learning Test</div>
              <div className="brand-subtitle">
                {selectedSubject?.name}
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#62736b',
            }}
          >
            {mode === 'practice'
              ? 'Latihan'
              : 'Ulangan'}
          </div>
        </header>

        <main className="main-content">
          <section className="welcome-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '10px',
              }}
            >
              <div className="welcome-badge">
                SOAL {currentQuestionIndex + 1}
              </div>

              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#6d7b75',
                }}
              >
                {currentQuestionIndex + 1} / {questions.length}
              </div>
            </div>

            <div
              style={{
                height: '7px',
                background: '#e7ece8',
                borderRadius: '99px',
                overflow: 'hidden',
                marginBottom: '28px',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: '#668879',
                  borderRadius: '99px',
                  transition: 'width 0.25s ease',
                }}
              />
            </div>

            <h1
              style={{
                fontSize: 'clamp(1.25rem, 3vw, 1.8rem)',
                lineHeight: 1.5,
              }}
            >
              {currentQuestion.question_text}
            </h1>

            {currentQuestion.image_url && (
              <div
                style={{
                  margin: '20px 0',
                  textAlign: 'center',
                }}
              >
                <img
                  src={currentQuestion.image_url}
                  alt="Ilustrasi soal"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '320px',
                    borderRadius: '12px',
                    objectFit: 'contain',
                  }}
                />
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gap: '12px',
                marginTop: '26px',
              }}
            >
              {currentQuestion.question_options?.map(
                (option, index) => {
                  const isSelected =
                    answers[currentQuestion.id] ===
                    option.id

                  const showCorrect =
                    mode === 'practice' &&
                    showFeedback &&
                    option.is_correct

                  const showWrong =
                    mode === 'practice' &&
                    showFeedback &&
                    isSelected &&
                    !option.is_correct

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        handleSelectAnswer(option.id)
                      }
                      disabled={showFeedback}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        width: '100%',
                        textAlign: 'left',
                        padding: '16px',
                        borderRadius: '14px',
                        border: showCorrect
                          ? '2px solid #668879'
                          : showWrong
                            ? '2px solid #b87968'
                            : isSelected
                              ? '2px solid #668879'
                              : '1px solid #d5ddd8',
                        background: showCorrect
                          ? '#edf5f0'
                          : showWrong
                            ? '#faf0ed'
                            : isSelected
                              ? '#f0f6f2'
                              : '#fffdf8',
                        color: '#35443e',
                        cursor: showFeedback
                          ? 'default'
                          : 'pointer',
                        fontSize: '1rem',
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        style={{
                          flex: '0 0 32px',
                          width: '32px',
                          height: '32px',
                          display: 'grid',
                          placeItems: 'center',
                          borderRadius: '50%',
                          background: isSelected
                            ? '#668879'
                            : '#edf1ee',
                          color: isSelected
                            ? '#ffffff'
                            : '#53645c',
                          fontWeight: 800,
                        }}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>

                      <span style={{ paddingTop: '5px' }}>
                        {option.option_text}
                      </span>
                    </button>
                  )
                }
              )}
            </div>

            {mode === 'practice' && showFeedback && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '16px',
                  borderRadius: '14px',
                  background: isCorrect
                    ? '#edf5f0'
                    : '#faf0ed',
                  border: `1px solid ${
                    isCorrect ? '#c7dbcf' : '#e4c9c1'
                  }`,
                }}
              >
                <strong
                  style={{
                    color: isCorrect
                      ? '#426b5a'
                      : '#9a6458',
                  }}
                >
                  {isCorrect
                    ? '✓ Jawaban benar'
                    : '✕ Jawaban belum tepat'}
                </strong>

                {!isCorrect && correctOption && (
                  <div
                    style={{
                      marginTop: '7px',
                      color: '#596961',
                    }}
                  >
                    Jawaban yang benar:{' '}
                    <strong>
                      {correctOption.option_text}
                    </strong>
                  </div>
                )}

                {currentQuestion.explanation && (
                  <div
                    style={{
                      marginTop: '10px',
                      color: '#596961',
                      lineHeight: 1.6,
                    }}
                  >
                    <strong>Pembahasan:</strong>{' '}
                    {currentQuestion.explanation}
                  </div>
                )}
              </div>
            )}

            <button
              className="primary-button"
              type="button"
              onClick={handleNextQuestion}
              disabled={
                !answers[currentQuestion.id] || savingResult
              }
              style={{ marginTop: '24px' }}
            >
              {currentQuestionIndex === questions.length - 1
                ? savingResult
                  ? 'Menyimpan...'
                  : 'Selesai'
                : 'Berikutnya'}
              <span>→</span>
            </button>
          </section>
        </main>

        <footer className="footer">
          <span>Learning Test</span>
          <span>•</span>
          <span>{name.trim()}</span>
        </footer>
      </div>
    )
  }

  if (showTestSetup) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">L</div>

            <div>
              <div className="brand-name">Learning Test</div>
              <div className="brand-subtitle">
                Latihan ulangan yang nyaman
              </div>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              onClick={handleOpenAdmin}
              style={{
                border: '1px solid #ccd3ce',
                background: '#fffdf8',
                color: '#496258',
                borderRadius: '10px',
                padding: '9px 13px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Admin
            </button>
          </div>
        </header>

        <main className="main-content">
          <section className="welcome-card">
            <div className="welcome-badge">
              PENGATURAN TES
            </div>

            <h1>
              Siapkan latihanmu,
              <br />
              <span>{selectedSubject?.name}</span>
            </h1>

            <p className="welcome-text">
              Pilih mode dan jumlah soal yang ingin kamu
              kerjakan.
            </p>

            <div className="setup-section">
              <div className="setup-label">
                Mode pengerjaan
              </div>

              <div className="mode-grid">
                <button
                  className={`mode-card ${
                    mode === 'practice' ? 'selected' : ''
                  }`}
                  type="button"
                  onClick={() => setMode('practice')}
                >
                  <div className="mode-icon">✎</div>

                  <div>
                    <h2>Latihan</h2>
                    <p>
                      Dapatkan feedback dan pembahasan
                      setelah menjawab.
                    </p>
                  </div>
                </button>

                <button
                  className={`mode-card ${
                    mode === 'test' ? 'selected' : ''
                  }`}
                  type="button"
                  onClick={() => setMode('test')}
                >
                  <div className="mode-icon">✓</div>

                  <div>
                    <h2>Ulangan</h2>
                    <p>
                      Kerjakan tanpa melihat benar atau
                      salah sampai tes selesai.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="setup-section">
              <div className="setup-label">
                Jumlah soal
              </div>

              {loadingQuestions ? (
                <div className="loading-state">
                  Memuat soal...
                </div>
              ) : questionCount === 0 ? (
                <div className="empty-state">
                  Belum ada soal untuk mata pelajaran ini.
                  <br />
                  Soal dapat ditambahkan melalui menu Admin.
                </div>
              ) : (
                <>
                  <div className="question-info">
                    Tersedia{' '}
                    <strong>{questionCount}</strong> soal
                  </div>

                  <div className="count-grid">
                    {[5, 10, 20, 30].map((count) => {
                      if (count > questionCount) return null

                      return (
                        <button
                          key={count}
                          className={`count-button ${
                            selectedCount === count
                              ? 'selected'
                              : ''
                          }`}
                          type="button"
                          onClick={() =>
                            setSelectedCount(count)
                          }
                        >
                          {count}
                        </button>
                      )
                    })}

                    <button
                      className={`count-button ${
                        selectedCount === questionCount
                          ? 'selected'
                          : ''
                      }`}
                      type="button"
                      onClick={() =>
                        setSelectedCount(questionCount)
                      }
                    >
                      Semua ({questionCount})
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="test-summary">
              <div>
                <span>Peserta</span>
                <strong>{name.trim()}</strong>
              </div>

              <div>
                <span>Mata pelajaran</span>
                <strong>{selectedSubject?.name}</strong>
              </div>

              <div>
                <span>Mode</span>
                <strong>
                  {mode === 'practice'
                    ? 'Latihan'
                    : 'Ulangan'}
                </strong>
              </div>

              <div>
                <span>Jumlah soal</span>
                <strong>{selectedCount || '-'}</strong>
              </div>
            </div>

            <button
              className="primary-button"
              type="button"
              onClick={handleBeginTest}
              disabled={
                loadingQuestions ||
                questionCount === 0 ||
                selectedCount === 0
              }
            >
              {loadingQuestions
                ? 'Memuat soal...'
                : 'Mulai Tes'}
              <span>→</span>
            </button>

            <button
              className="back-button"
              type="button"
              onClick={handleBackToSubjects}
            >
              ← Kembali memilih mata pelajaran
            </button>
          </section>
        </main>

        <footer className="footer">
          <span>Learning Test</span>
          <span>•</span>
          <span>
            Belajar sedikit demi sedikit setiap hari.
          </span>
        </footer>
      </div>
    )
  }

  if (showSubjects) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">L</div>

            <div>
              <div className="brand-name">Learning Test</div>
              <div className="brand-subtitle">
                Latihan ulangan yang nyaman
              </div>
            </div>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              onClick={handleOpenAdmin}
              style={{
                border: '1px solid #ccd3ce',
                background: '#fffdf8',
                color: '#496258',
                borderRadius: '10px',
                padding: '9px 13px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Admin
            </button>
          </div>
        </header>

        <main className="main-content">
          <section className="welcome-card">
            <div className="welcome-badge">
              PILIH MATERI
            </div>

            <h1>
              Halo, <span>{name.trim()}</span>
            </h1>

            <p className="welcome-text">
              Pilih mata pelajaran yang ingin kamu
              gunakan untuk latihan.
            </p>

            {loadingSubjects ? (
              <div className="loading-state">
                Memuat mata pelajaran...
              </div>
            ) : subjects.length === 0 ? (
              <div className="empty-state">
                Belum ada mata pelajaran yang tersedia.
              </div>
            ) : (
              <div className="subject-grid">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    className="subject-card"
                    type="button"
                    onClick={() =>
                      handleSelectSubject(subject)
                    }
                  >
                    <div className="subject-icon">
                      {subject.name.charAt(0)}
                    </div>

                    <div className="subject-content">
                      <h2>{subject.name}</h2>

                      <p>
                        {subject.description ||
                          'Latihan soal dan ulangan.'}
                      </p>
                    </div>

                    <span className="subject-arrow">
                      →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </main>

        <footer className="footer">
          <span>Learning Test</span>
          <span>•</span>
          <span>
            Belajar sedikit demi sedikit setiap hari.
          </span>
        </footer>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">L</div>

          <div>
            <div className="brand-name">Learning Test</div>
            <div className="brand-subtitle">
              Latihan ulangan yang nyaman
            </div>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            onClick={handleOpenAdmin}
            style={{
              border: '1px solid #ccd3ce',
              background: '#fffdf8',
              color: '#496258',
              borderRadius: '10px',
              padding: '9px 13px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Admin
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="welcome-card">
          <div className="welcome-badge">
            RUANG BELAJAR
          </div>

          <h1>
            Belajar dengan tenang,
            <br />
            <span>latihan dengan percaya diri.</span>
          </h1>

          <p className="welcome-text">
            Kerjakan latihan soal secara acak dan lihat
            perkembangan hasil belajarmu setelah selesai.
          </p>

          <div className="name-section">
            <label htmlFor="student-name">
              Nama kamu
            </label>

            <input
              id="student-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleStart()
                }
              }}
              placeholder="Masukkan nama"
              autoComplete="name"
            />

            <button
              className="primary-button"
              type="button"
              onClick={handleStart}
              disabled={!name.trim() || loading}
            >
              {loading
                ? 'Menyimpan...'
                : 'Mulai Belajar'}

              {!loading && <span>→</span>}
            </button>
          </div>
        </section>

        <section className="feature-grid">
          <article className="feature-card">
            <div className="feature-icon">↗</div>

            <h2>Soal Acak</h2>

            <p>
              Urutan soal dan pilihan jawaban dapat berubah
              setiap kali latihan.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-icon">✓</div>

            <h2>Hasil Langsung</h2>

            <p>
              Lihat nilai, jumlah benar, salah, tanggal,
              dan waktu pengerjaan setelah tes selesai.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-icon">◎</div>

            <h2>Belajar Lagi</h2>

            <p>
              Jika nilai belum mencapai 85, kamu akan
              disarankan untuk mengulang latihan.
            </p>
          </article>
        </section>
      </main>

      <footer className="footer">
        <span>Learning Test</span>
        <span>•</span>
        <span>
          Belajar sedikit demi sedikit setiap hari.
        </span>
      </footer>
    </div>
  )
}

export default App