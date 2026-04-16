import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiRequest } from '../lib/api'

export function ExamCreatePage() {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [durationLimit, setDurationLimit] = useState<number | ''>('')
  const [isPublished, setIsPublished] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await apiRequest(`/api/classes/${classId}/exams`, {
        method: 'POST',
        body: {
          title,
          description,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          durationLimit: durationLimit === '' ? null : Number(durationLimit),
          isPublished,
        },
      })
      navigate(`/classes/${classId}`)
    } catch (submitError) {
      const text = submitError instanceof Error ? submitError.message : 'Gagal membuat ujian'
      setError(text)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="screen" style={{ padding: '2rem 1rem' }}>
      <form className="card" onSubmit={onSubmit} style={{ maxWidth: '600px', width: '100%' }}>
        <h1>Buat Ujian Baru</h1>
        
        <label>
          Judul Ujian
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        
        <label>
          Soal / Perintah / Deskripsi (Markdown)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={10}
            required
            style={{ width: '100%', padding: '0.5rem', resize: 'vertical' }}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label>
            Waktu Mulai
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </label>
          <label>
            Waktu Selesai
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </label>
        </div>

        <label>
          Batas Durasi Pengerjaan Individu (menit) [Kosongkan jika bebas sampai waktu Selesai]
          <input
            type="number"
            value={durationLimit}
            onChange={(e) => setDurationLimit(e.target.value ? Number(e.target.value) : '')}
            min={1}
            placeholder="Contoh: 120"
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'normal', marginTop: '1rem' }}>
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            style={{ width: 'auto' }}
          />
          <span>Publikasikan (Murid bisa melihat)</span>
        </label>

        {error && <div className="alert error">{error}</div>}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button disabled={loading} type="submit" style={{ flex: 1 }}>
            {loading ? 'Menyimpan...' : 'Simpan Ujian'}
          </button>
          <button type="button" onClick={() => navigate(-1)} style={{ background: '#f1f5f9', color: '#475569' }}>
            Batal
          </button>
        </div>
      </form>
    </main>
  )
}
