import { useState } from 'react'
import { supabase } from '../supabase'
import './QuestionImporter.css'

function QuestionImporter({ onBack }) {
  const [file, setFile] = useState(null)
  const [isReading, setIsReading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [result, setResult] = useState(null)

  function normalizeText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  function isQuestionStart(line) {
    return /^(?:soal\s*)?\d+\s*[\.\):\-]\s*/i.test(
      line.trim()
    )
  }

  function isOptionLine(line) {
    return /^([A-Z])\s*[\.\):\-]\s+/i.test(
      line.trim()
    )
  }

  function stripAnswerPrefix(line) {
    return line
      .replace(/^[✓✔☑☒\u2713\u2714\u2611\u2612\s]+/, '')
      .trim()
  }

  function isAnswerLine(line) {
    const cleaned = stripAnswerPrefix(line)

    return /^(?:kunci\s+jawaban|jawaban\s+benar|jawaban|answer\s+key|answer|kunci)\s*[:=\-]?\s*[A-Z](?:\s*[\.\):\-]|\s|$)/i.test(
      cleaned
    )
  }

  function extractAnswerLetter(text) {
    const cleaned = stripAnswerPrefix(text)

    const match = cleaned.match(
      /^(?:kunci\s+jawaban|jawaban\s+benar|jawaban|answer\s+key|answer|kunci)\s*[:=\-]?\s*([A-Z])(?:\s*[\.\):\-]|\s|$)/i
    )

    return match ? match[1].toUpperCase() : null
  }

  function extractQuestionNumber(line) {
    const match = line.match(
      /^(?:soal\s*)?(\d+)\s*[\.\):\-]\s*/i
    )

    return match ? Number(match[1]) : null
  }

  function cleanQuestionStart(line) {
    return line
      .replace(
        /^(?:soal\s*)?\d+\s*[\.\):\-]\s*/i,
        ''
      )
      .trim()
  }

  function cleanOptionStart(line) {
    return line
      .replace(/^([A-Z])\s*[\.\):\-]\s+/i, '')
      .trim()
  }

  function parseAnswerSection(lines) {
    const answers = {}
    let insideAnswerSection = false

    for (const rawLine of lines) {
      const line = stripAnswerPrefix(rawLine)

      if (!line) continue

      if (
        /^(?:kunci\s+jawaban|answer\s+key|answer\s+keys?)$/i.test(
          line
        )
      ) {
        insideAnswerSection = true
        continue
      }

      if (!insideAnswerSection) continue

      const match = line.match(
        /^(\d+)\s*[\.\):\-]?\s*([A-Z])(?:\s*[\.\):\-]|\s|$)/i
      )

      if (match) {
        answers[Number(match[1])] =
          match[2].toUpperCase()
      }
    }

    return answers
  }

  function validateQuestion(question) {
    const problems = []

    if (!question.questionText.trim()) {
      problems.push('Pertanyaan kosong')
    }

    if (question.options.length < 2) {
      problems.push('Pilihan kurang dari 2')
    }

    if (question.options.length > 5) {
      problems.push('Pilihan lebih dari 5')
    }

    if (!question.answerLetter) {
      problems.push('Kunci jawaban tidak ditemukan')
    } else {
      const answerExists = question.options.some(
        (option) =>
          option.letter === question.answerLetter
      )

      if (!answerExists) {
        problems.push(
          `Kunci ${question.answerLetter} tidak memiliki pilihan`
        )
      }
    }

    return problems
  }

  function parseQuestions(rawText) {
    const normalized = normalizeText(rawText)

    const lines = normalized
      .split('\n')
      .map((line) => line.trim())

    const answerSectionIndex = lines.findIndex((line) =>
      /^(kunci\s+jawaban|answer\s+key|answer\s+keys?)$/i.test(
        line
      )
    )

    const answerMap = parseAnswerSection(lines)

    const questionLines =
      answerSectionIndex >= 0
        ? lines.slice(0, answerSectionIndex)
        : lines

    const questions = []

    let current = null
    let currentOption = null

    function pushCurrent() {
      if (!current) return

      current.questionText =
        current.questionText.trim()

      current.options = current.options.map(
        (option) => ({
          ...option,
          text: option.text.trim(),
        })
      )

      if (!current.answerLetter) {
        current.answerLetter =
          answerMap[current.number] || null
      }

      current.problems =
        validateQuestion(current)

      current.isValid =
        current.problems.length === 0

      questions.push(current)
    }

    for (const line of questionLines) {
      if (!line) {
        currentOption = null
        continue
      }

      if (isQuestionStart(line)) {
        pushCurrent()

        current = {
          number: extractQuestionNumber(line),
          questionText: cleanQuestionStart(line),
          options: [],
          answerLetter: null,
          explanation: '',
          problems: [],
          isValid: false,
        }

        currentOption = null
        continue
      }

      if (!current) continue

      if (isAnswerLine(line)) {
        const answer = extractAnswerLetter(line)

        if (answer) {
          current.answerLetter = answer
        }

        currentOption = null
        continue
      }

      if (isOptionLine(line)) {
        const letterMatch = line.match(
          /^([A-Z])\s*[\.\):\-]\s+/i
        )

        const letter = letterMatch
          ? letterMatch[1].toUpperCase()
          : null

        current.options.push({
          letter,
          text: cleanOptionStart(line),
        })

        currentOption =
          current.options.length - 1

        continue
      }

      if (currentOption !== null) {
        current.options[
          currentOption
        ].text += ` ${line}`
      } else {
        current.questionText += ` ${line}`
      }
    }

    pushCurrent()

    return questions
  }

  async function loadSubjects() {
    const { data, error: subjectError } =
      await supabase
        .from('subjects')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name', {
          ascending: true,
        })

    if (subjectError) {
      throw new Error(subjectError.message)
    }

    setSubjects(data || [])

    if (!selectedSubject && data?.length > 0) {
      setSelectedSubject(data[0].id)
    }
  }

  async function readFile(selectedFile) {
    setIsReading(true)
    setError('')
    setSuccess('')
    setResult(null)

    try {
      await loadSubjects()

      let text = ''

      if (
        selectedFile.name
          .toLowerCase()
          .endsWith('.txt')
      ) {
        text = await selectedFile.text()
      } else if (
        selectedFile.name
          .toLowerCase()
          .endsWith('.docx')
      ) {
        const mammothModule = await import('mammoth')
        const mammoth = mammothModule.default || mammothModule

        const arrayBuffer =
          await selectedFile.arrayBuffer()

        const mammothResult =
          await mammoth.extractRawText({
            arrayBuffer,
          })

        text = mammothResult.value
      } else {
        throw new Error(
          'Gunakan file TXT atau DOCX.'
        )
      }

      if (!text.trim()) {
        throw new Error(
          'File tidak berisi teks yang dapat dibaca.'
        )
      }

      const questions =
        parseQuestions(text)

      const validQuestions =
        questions.filter(
          (question) => question.isValid
        )

      const invalidQuestions =
        questions.filter(
          (question) => !question.isValid
        )

      setResult({
        questions,
        total: questions.length,
        valid: validQuestions.length,
        invalid: invalidQuestions.length,
      })
    } catch (readError) {
      setError(readError.message)
    } finally {
      setIsReading(false)
    }
  }

  function handleFileChange(event) {
    const selectedFile =
      event.target.files?.[0]

    if (!selectedFile) return

    setFile(selectedFile)
    readFile(selectedFile)
  }

  async function handleImport() {
    if (!result || result.valid === 0) {
      setError(
        'Tidak ada soal valid yang dapat diimport.'
      )
      return
    }

    if (!selectedSubject) {
      setError(
        'Silakan pilih mata pelajaran terlebih dahulu.'
      )
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    let importedCount = 0
    let failedCount = 0

    try {
      const validQuestions =
        result.questions.filter(
          (question) => question.isValid
        )

      for (const question of validQuestions) {
        const { data: insertedQuestion, error: questionError } =
          await supabase
            .from('questions')
            .insert({
              subject_id: selectedSubject,
              question_text:
                question.questionText,
              explanation:
                question.explanation || null,
              difficulty: 'medium',
              is_active: true,
            })
            .select('id')
            .single()

        if (questionError) {
          failedCount++
          continue
        }

        const optionRows =
          question.options.map(
            (option, index) => ({
              question_id:
                insertedQuestion.id,
              option_text: option.text,
              is_correct:
                option.letter ===
                question.answerLetter,
              option_order: index + 1,
            })
          )

        const { error: optionError } =
          await supabase
            .from('question_options')
            .insert(optionRows)

        if (optionError) {
          await supabase
            .from('questions')
            .delete()
            .eq(
              'id',
              insertedQuestion.id
            )

          failedCount++
          continue
        }

        importedCount++
      }

      if (importedCount > 0) {
        setSuccess(
          `${importedCount} soal berhasil dimasukkan ke Question Bank${
            failedCount > 0
              ? `. ${failedCount} soal gagal disimpan.`
              : '.'
          }`
        )
      } else {
        setError(
          'Tidak ada soal yang berhasil disimpan.'
        )
      }
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="question-importer">
      <div className="question-importer-header">
        <div>
          <button
            className="question-importer-back"
            onClick={onBack}
          >
            ← Kembali
          </button>

          <h2>Import Question Bank</h2>

          <p>
            Upload satu dokumen berisi banyak soal.
            Sistem akan membaca dan memisahkan soal
            secara otomatis.
          </p>
        </div>
      </div>

      <div className="question-import-card">
        <div className="question-import-icon">
          📄
        </div>

        <h3>Upload Dokumen Soal</h3>

        <p>
          Format yang didukung:
          <strong> TXT</strong> dan
          <strong> DOCX</strong>
        </p>

        <label className="question-file-button">
          {isReading
            ? 'Membaca dokumen...'
            : 'Pilih File Soal'}

          <input
            type="file"
            accept=".txt,.docx"
            onChange={handleFileChange}
            disabled={isReading || isSaving}
          />
        </label>

        {file && (
          <div className="question-selected-file">
            <span>📎</span>
            <span>{file.name}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="question-import-error">
          <strong>Kesalahan:</strong>{' '}
          {error}
        </div>
      )}

      {success && (
        <div className="question-import-success">
          ✓ {success}
        </div>
      )}

      {isReading && (
        <div className="question-import-loading">
          Membaca dan menganalisis soal...
        </div>
      )}

      {result && !isReading && (
        <div className="question-import-result">

          {subjects.length > 0 && (
            <div className="question-subject-select">
              <label htmlFor="import-subject">
                Simpan ke Mata Pelajaran
              </label>

              <select
                id="import-subject"
                value={selectedSubject}
                onChange={(event) =>
                  setSelectedSubject(
                    event.target.value
                  )
                }
                disabled={isSaving}
              >
                <option value="">
                  Pilih mata pelajaran
                </option>

                {subjects.map((subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="question-result-summary">
            <div className="question-result-item">
              <strong>
                {result.total}
              </strong>
              <span>Total Soal</span>
            </div>

            <div className="question-result-item valid">
              <strong>
                {result.valid}
              </strong>
              <span>Valid</span>
            </div>

            <div className="question-result-item invalid">
              <strong>
                {result.invalid}
              </strong>
              <span>Perlu Diperiksa</span>
            </div>
          </div>

          {result.valid > 0 && (
            <button
              className="question-import-save-button"
              onClick={handleImport}
              disabled={isSaving}
            >
              {isSaving
                ? 'Menyimpan soal...'
                : `⬇ Import ${result.valid} Soal ke Question Bank`}
            </button>
          )}

          <div className="question-preview-header">
            <div>
              <h3>Preview Soal</h3>

              <p>
                Periksa hasil pembacaan sebelum
                memasukkan soal ke Question Bank.
              </p>
            </div>
          </div>

          <div className="question-preview-list">
            {result.questions.map(
              (question, index) => (
                <div
                  className={`question-preview-card ${
                    question.isValid
                      ? 'valid'
                      : 'invalid'
                  }`}
                  key={`${question.number}-${index}`}
                >
                  <div className="question-preview-top">
                    <span>
                      Soal{' '}
                      {question.number ||
                        index + 1}
                    </span>

                    <span
                      className={`question-preview-status ${
                        question.isValid
                          ? 'valid'
                          : 'invalid'
                      }`}
                    >
                      {question.isValid
                        ? '✓ Valid'
                        : '⚠ Perlu diperiksa'}
                    </span>
                  </div>

                  <div className="question-preview-text">
                    {question.questionText ||
                      '(Pertanyaan kosong)'}
                  </div>

                  <div className="question-preview-options">
                    {question.options.map(
                      (option) => (
                        <div
                          className={`question-preview-option ${
                            option.letter ===
                            question.answerLetter
                              ? 'correct'
                              : ''
                          }`}
                          key={option.letter}
                        >
                          <strong>
                            {option.letter}.
                          </strong>

                          <span>
                            {option.text}
                          </span>

                          {option.letter ===
                            question.answerLetter && (
                            <small>
                              ✓ Kunci
                            </small>
                          )}
                        </div>
                      )
                    )}
                  </div>

                  {!question.isValid && (
                    <div className="question-preview-problems">
                      {question.problems.map(
                        (problem) => (
                          <div key={problem}>
                            ⚠ {problem}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {result.valid > 0 && (
            <button
              className="question-import-save-button bottom"
              onClick={handleImport}
              disabled={isSaving}
            >
              {isSaving
                ? 'Menyimpan soal...'
                : `⬇ Import ${result.valid} Soal ke Question Bank`}
            </button>
          )}

          <div className="question-import-next">
            <p>
              <strong>
                Soal valid akan disimpan
                ke Question Bank.
              </strong>{' '}
              Soal yang bermasalah tidak akan
              dimasukkan.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionImporter