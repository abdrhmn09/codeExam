import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../lib/api'

export function ClassJoinPage() {
  const navigate = useNavigate()
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await apiRequest<{ class: { id: string } }>('/api/classes/join', {
        method: 'POST',
        body: { inviteCode },
      })
      navigate(`/classes/${res.class.id}`)
    } catch (submitError) {
      const text = submitError instanceof Error ? submitError.message : 'Gagal bergabung'
      setError(text)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="screen">
      <form className="card" onSubmit={onSubmit}>
        <h1>Bergabung ke Kelas</h1>
        
        <label>
          Kode Undangan
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            required
            maxLength={8}
            placeholder="KODE UNIK"
          />
        </label>

        {error && <div className="alert error">{error}</div>}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button disabled={loading} type="submit" style={{ flex: 1 }}>
            {loading ? 'Memproses...' : 'Gabung Kelas'}
          </button>
          <button type="button" onClick={() => navigate(-1)} style={{ background: '#f1f5f9', color: '#475569' }}>
            Batal
          </button>
        </div>
      </form>
    </main>
  )
}
