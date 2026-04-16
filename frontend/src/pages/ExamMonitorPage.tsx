import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { apiRequest } from '../lib/api'

type AttemptSummary = {
  id: string
  examId: string
  studentId: string
  startTime: string
  submittedAt: string | null
  status: string
  code: string | null
  warningCount: number
  score: number | null
  comment: string | null
  student: {
    email: string
  }
}

type Student = {
  id: string
  email: string
}

type ExamDetails = {
  id: string
  classId: string
  title: string
  description: string
  startTime: string
  endTime: string
  isPublished: boolean
  attempts: AttemptSummary[]
}

type FileNode = {
  path: string
  type: 'file' | 'folder'
  content: string
}

const emptyAttempt: AttemptSummary = {
  id: '',
  examId: '',
  studentId: '',
  startTime: '',
  submittedAt: null,
  status: 'NONE',
  code: null,
  warningCount: 0,
  score: null,
  comment: null,
  student: { email: '' },
}

function parseAttemptCode(code: string | null): FileNode[] {
  const defaultFiles: FileNode[] = [
    { path: 'index.html', type: 'file', content: '<h1>Belum ada kode</h1>' },
  ]

  if (!code) return defaultFiles

  try {
    const parsed = JSON.parse(code)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
  } catch {
    // fallback below
  }

  return [{ path: 'main.txt', type: 'file', content: code }]
}

function buildPreview(fileSystem: FileNode[]) {
  const htmlContent = fileSystem.find((file) => file.path.endsWith('.html'))?.content ?? ''
  const cssContent = fileSystem
    .filter((file) => file.path.endsWith('.css'))
    .map((file) => file.content)
    .join('\n')
  const jsContent = fileSystem
    .filter((file) => file.path.endsWith('.js'))
    .map((file) => file.content)
    .join('\n')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${cssContent}</style>
      </head>
      <body>
        ${htmlContent}
        <script>
          try {
            ${jsContent}
          } catch (err) {
            console.error(err)
          }
        </script>
      </body>
    </html>
  `
}

export function ExamMonitorPage() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()

  const [exam, setExam] = useState<ExamDetails | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptSummary | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<FileNode[]>([])
  const [activeFile, setActiveFile] = useState<string>('index.html')
  const [score, setScore] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingAttempt, setLoadingAttempt] = useState(false)
  const [savingGrade, setSavingGrade] = useState(false)
  const [error, setError] = useState('')

  const attemptsByStudent = useMemo(() => {
    const map = new Map<string, AttemptSummary>()
    exam?.attempts.forEach((attempt) => map.set(attempt.studentId, attempt))
    return map
  }, [exam])

  useEffect(() => {
    const load = async () => {
      if (!examId) return

      setLoading(true)
      setError('')

      try {
        const examResponse = await apiRequest<ExamDetails>(`/api/exams/${examId}`)
        setExam(examResponse)

        const studentsResponse = await apiRequest<Student[]>(`/api/classes/${examResponse.classId}/students`)
        setStudents(studentsResponse)

        const firstStudent = studentsResponse[0]
        if (firstStudent) {
          setSelectedStudentId(firstStudent.id)
        }
      } catch (loadError) {
        const text = loadError instanceof Error ? loadError.message : 'Gagal memuat data monitor'
        setError(text)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [examId])

  useEffect(() => {
    const loadAttempt = async () => {
      if (!examId || !selectedStudentId) {
        setSelectedAttempt(null)
        return
      }

      setLoadingAttempt(true)

      try {
        const attempt = await apiRequest<AttemptSummary>(`/api/exams/${examId}/attempts/${selectedStudentId}`)
        setSelectedAttempt(attempt)
        setSelectedFiles(parseAttemptCode(attempt?.code ?? null))
        setActiveFile(parseAttemptCode(attempt?.code ?? null)[0]?.path ?? 'index.html')
        setScore(attempt.score === null ? '' : String(attempt.score))
        setComment(attempt?.comment ?? '')
      } catch {
        const fallbackStudent = students.find((student) => student.id === selectedStudentId)
        const fallback: AttemptSummary = {
          ...emptyAttempt,
          studentId: selectedStudentId,
          student: { email: fallbackStudent?.email ?? '-' },
        }
        setSelectedAttempt(fallback)
        setSelectedFiles(parseAttemptCode(null))
        setActiveFile('index.html')
        setScore('')
        setComment('')
      } finally {
        setLoadingAttempt(false)
      }
    }

    void loadAttempt()
  }, [examId, selectedStudentId, students])

  const currentAttempt = selectedStudentId ? attemptsByStudent.get(selectedStudentId) ?? selectedAttempt : selectedAttempt
  const activeFileContent = selectedFiles.find((file) => file.path === activeFile)?.content ?? ''

  const handleGradeSubmit = async () => {
    if (!examId || !selectedStudentId) return

    setSavingGrade(true)
    setError('')

    try {
      const normalizedScore = score.trim() === '' ? null : Number(score)

      if (normalizedScore !== null && Number.isNaN(normalizedScore)) {
        setError('Nilai harus berupa angka')
        return
      }

      await apiRequest(`/api/exams/${examId}/attempts/${selectedStudentId}/grade`, {
        method: 'POST',
        body: {
          score: normalizedScore,
          comment: comment.trim() === '' ? null : comment,
        },
      })

      const refreshed = await apiRequest<AttemptSummary>(`/api/exams/${examId}/attempts/${selectedStudentId}`)
      setSelectedAttempt(refreshed)
      setSelectedFiles(parseAttemptCode(refreshed.code ?? null))
      setActiveFile(parseAttemptCode(refreshed.code ?? null)[0]?.path ?? 'index.html')

      if (exam) {
        const updatedAttempts = exam.attempts.map((attempt) =>
          attempt.studentId === selectedStudentId ? refreshed : attempt,
        )
        setExam({ ...exam, attempts: updatedAttempts })
      }

      alert('Nilai berhasil disimpan')
    } catch (gradeError) {
      const text = gradeError instanceof Error ? gradeError.message : 'Gagal menyimpan nilai'
      setError(text)
    } finally {
      setSavingGrade(false)
    }
  }

  if (loading) return <div className="screen">Memuat monitor...</div>
  if (error) return <div className="screen">{error}</div>
  if (!exam) return <div className="screen">Ujian tidak ditemukan</div>

  return (
    <main style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#f8fafc' }}>
      <aside style={{ width: '280px', borderRight: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
          <button type="button" onClick={() => navigate(-1)} style={{ background: '#f1f5f9', color: '#475569', marginBottom: '0.75rem' }}>
            ← Kembali
          </button>
          <h2 style={{ margin: 0 }}>{exam.title}</h2>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#64748b' }}>
            {format(new Date(exam.startTime), 'PPpp')} - {format(new Date(exam.endTime), 'PPpp')}
          </p>
        </div>

        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', color: '#334155' }}>
          Daftar Peserta
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {students.map((student) => {
            const attempt = attemptsByStudent.get(student.id)
            const isSelected = selectedStudentId === student.id
            const statusLabel = attempt ? (attempt.status === 'SUBMITTED' ? 'Terkumpul' : 'Berjalan') : 'Belum mulai'

            return (
              <div
                key={student.id}
                style={{
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid #f1f5f9',
                  background: isSelected ? '#eff6ff' : '#fff',
                }}
              >
                <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{student.email}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{statusLabel}</div>
                {typeof attempt?.score === 'number' && (
                  <div style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: '0.25rem' }}>Nilai: {attempt.score}</div>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedStudentId(student.id)}
                  style={{ marginTop: '0.5rem', background: '#2563eb', color: 'white', width: '100%' }}
                >
                  Nilai
                </button>
              </div>
            )
          })}
        </div>
      </aside>

      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '1rem 1.25rem', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
          <h1 style={{ margin: 0 }}>Monitor & Nilai</h1>
          <p style={{ margin: '0.4rem 0 0', color: '#64748b' }}>{exam.description}</p>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '220px 1fr 360px', minHeight: 0 }}>
          <div style={{ borderRight: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>File</div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {selectedFiles.map((file) => (
                <div
                  key={file.path}
                  onClick={() => setActiveFile(file.path)}
                  style={{
                    padding: '0.55rem 1rem',
                    cursor: 'pointer',
                    background: activeFile === file.path ? '#dbeafe' : 'transparent',
                    borderBottom: '1px solid #eef2f7',
                  }}
                >
                  <span style={{ marginRight: '0.5rem' }}>{file.type === 'folder' ? '📁' : '📄'}</span>
                  {file.path.split('/').pop()}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, background: '#fff' }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.9rem' }}>
              {loadingAttempt ? 'Memuat attempt...' : currentAttempt?.student?.email || '-'}
            </div>
            <textarea
              value={activeFileContent}
              readOnly
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                resize: 'none',
                padding: '1rem',
                fontFamily: 'Consolas, monospace',
                fontSize: '0.95rem',
                background: '#ffffff',
                color: '#0f172a',
              }}
            />
          </div>

          <div style={{ borderLeft: '1px solid #e2e8f0', background: '#fff', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold' }}>Hasil & Nilai</div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', minHeight: 0, flex: 1, overflowY: 'auto' }}>
                <div style={{ marginBottom: '0.75rem', color: '#334155' }}>
                  <div><strong>Status:</strong> {currentAttempt?.status ?? 'Belum mulai'}</div>
                  <div><strong>Warning:</strong> {currentAttempt?.warningCount ?? 0}</div>
                  <div><strong>Mulai:</strong> {currentAttempt?.startTime ? format(new Date(currentAttempt.startTime), 'PPpp') : '-'}</div>
                  <div><strong>Submit:</strong> {currentAttempt?.submittedAt ? format(new Date(currentAttempt.submittedAt), 'PPpp') : '-'}</div>
                </div>

                <iframe
                  title="Preview Peserta"
                  srcDoc={buildPreview(selectedFiles)}
                  style={{ width: '100%', minHeight: '240px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}
                />

                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.35rem' }}>Nilai</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="0 - 100"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.35rem' }}>Komentar</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={6}
                    placeholder="Tulis komentar untuk peserta..."
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={handleGradeSubmit}
                  disabled={savingGrade || !currentAttempt || currentAttempt.status === 'NONE'}
                  style={{ width: '100%', background: '#2563eb', color: 'white' }}
                >
                  {savingGrade ? 'Menyimpan...' : 'Simpan Nilai'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}