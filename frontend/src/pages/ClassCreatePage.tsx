import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../lib/api'

export function ClassCreatePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const cls = await apiRequest<{ id: string }>('/api/classes', {
        method: 'POST',
        body: { name, description },
      })
      navigate(`/classes/${cls.id}`)
    } catch (submitError) {
      const text = submitError instanceof Error ? submitError.message : 'Gagal membuat kelas'
      setError(text)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="screen">
      <form className="card" onSubmit={onSubmit}>
        <h1>Buat Kelas Baru</h1>
        
        <label>
          Nama Kelas
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        
        <label>
          Deskripsi
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </label>

        {error && <div className="alert error">{error}</div>}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button disabled={loading} type="submit" style={{ flex: 1 }}>
            {loading ? 'Membuat...' : 'Buat Kelas'}
          </button>
          <button type="button" onClick={() => navigate(-1)} style={{ background: '#f1f5f9', color: '#475569' }}>
            Batal
          </button>
        </div>
      </form>
    </main>
  )
}
