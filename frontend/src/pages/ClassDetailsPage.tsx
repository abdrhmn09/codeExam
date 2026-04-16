import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { apiRequest } from '../lib/api'
import { format, isBefore, isAfter } from 'date-fns'

type Exam = {
  id: string
  title: string
  startTime: string
  endTime: string
  isPublished: boolean
  attempts?: {
    status: string
    submittedAt: string | null
    score: number | null
    comment: string | null
  }[]
}

type ClassData = {
  id: string
  name: string
  description: string | null
  inviteCode: string
  teacherId: string
  teacher: { id: string; name: string | null; npm: string | null; email: string }
  _count: { enrollments: number }
  exams: Exam[]
}

export function ClassDetailsPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [data, setData] = useState<ClassData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    const fetchClassDetails = async () => {
      try {
        const response = await apiRequest<ClassData>(`/api/classes/${id}`)
        setData(response)
        setError('')
      } catch (fetchError) {
        const text = fetchError instanceof Error ? fetchError.message : 'Gagal memuat kelas'
        setError(text)
      }
    }

    void fetchClassDetails()

    const intervalId = window.setInterval(() => {
      void fetchClassDetails()
    }, 10000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [id])

  if (error) return <div className="screen">{error}</div>
  if (!data) return <div className="screen">Memuat kelas...</div>

  const isTeacher = user?.id === data.teacherId

  const handleDeleteExam = async (examId: string, examTitle: string) => {
    const confirmed = window.confirm(`Yakin ingin menghapus ujian "${examTitle}"?`)
    if (!confirmed) return

    try {
      await apiRequest(`/api/exams/${examId}`, { method: 'DELETE' })
      setData(prev => {
        if (!prev) return prev
        return {
          ...prev,
          exams: prev.exams.filter(exam => exam.id !== examId),
        }
      })
      alert('Ujian berhasil dihapus')
    } catch (deleteError) {
      const text = deleteError instanceof Error ? deleteError.message : 'Gagal menghapus ujian'
      alert(text)
    }
  }

  return (
    <main className="screen" style={{ flexDirection: 'column', padding: '2rem', justifyContent: 'flex-start' }}>
      <header style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
           <h1>{data.name}</h1>
           <p>{data.description}</p>
            {isTeacher && <p><strong>Kode Undangan: </strong> <span style={{ background: '#eee', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{data.inviteCode}</span></p>}
            {!isTeacher && <p>Pengajar: {data.teacher.name || data.teacher.email}</p>}
           <p>Total Peserta: {data._count.enrollments} orang</p>
        </div>
        <div>
          <Link to="/" style={{ color: '#2563eb' }}>&larr; Kembali</Link>
        </div>
      </header>

      <section style={{ width: '100%', maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
           <h2>Daftar Ujian / Tugas</h2>
            {isTeacher && (
             <Link to={`/classes/${id}/exams/create`} className="btn" style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>+ Buat Ujian Baru</Link>
           )}
        </div>

        {data.exams.length === 0 ? (
          <p>Belum ada ujian di kelas ini.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.exams.map((exam) => {
              const start = new Date(exam.startTime)
              const end = new Date(exam.endTime)
              const now = new Date()
              const isPast = isBefore(now, start)
              const isEnded = isAfter(now, end)
              const isActive = !isPast && !isEnded
              const studentAttempt = !isTeacher ? exam.attempts?.[0] : undefined
              const isSubmitted = studentAttempt?.status === 'SUBMITTED'

              return (
                <div key={exam.id} style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', opacity: isEnded ? 0.7 : 1 }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{exam.title} {isTeacher && !exam.isPublished && <span style={{ color: 'red', fontSize: '0.8rem' }}>(Draft)</span>}</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
                       Mulai: {format(start, 'PPpp')} <br/>
                       Selesai: {format(end, 'PPpp')}
                    </p>
                    <div>
                      {isPast && <span style={{ color: '#da9823', fontWeight: 'bold' }}>Belum dimulai</span>}
                      {isActive && <span style={{ color: 'green', fontWeight: 'bold' }}>Sedang Berjalan</span>}
                      {isEnded && <span style={{ color: 'red', fontWeight: 'bold' }}>Sudah Berakhir</span>}
                    </div>
                    {!isTeacher && isSubmitted && (
                      <div style={{ marginTop: '0.5rem', padding: '0.5rem', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                          Status jawaban: <strong>Terkumpul</strong>
                        </div>
                        {typeof studentAttempt?.score === 'number' && (
                          <div style={{ fontSize: '0.85rem', color: '#16a34a', marginTop: '0.25rem' }}>
                            Nilai: <strong>{studentAttempt.score}</strong>
                          </div>
                        )}
                        {studentAttempt?.comment && (
                          <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                            Komentar pengajar: {studentAttempt.comment}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {isTeacher ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link to={`/exams/${exam.id}/monitor`} style={{ padding: '0.5rem 1rem', background: '#1f2937', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>Monitor & Nilai</Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteExam(exam.id, exam.title)}
                            style={{ padding: '0.5rem 1rem', background: '#dc2626', color: 'white' }}
                          >
                            Hapus
                          </button>
                        </div>
                     ) : (
                        <Link 
                          to={`/exams/${exam.id}/editor`} 
                          onClick={(e) => { if(isPast) { e.preventDefault(); alert('Ujian belum dimulai') } }}
                          style={{ padding: '0.5rem 1rem', background: isPast ? '#f1f5f9' : '#2563eb', color: isPast ? '#475569' : 'white', textDecoration: 'none', borderRadius: '4px', cursor: isPast ? 'not-allowed' : 'pointer' }}>
                            {isSubmitted ? 'Review Jawaban' : (isEnded ? 'Lihat Hasil' : (isActive ? 'Mulai Ujian' : 'Tunggu'))}
                        </Link>
                     )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
