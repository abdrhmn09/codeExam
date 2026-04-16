import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiRequest } from '../lib/api'

export function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Memverifikasi email...')
  const hasVerified = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token verifikasi tidak ditemukan')
      return
    }

    if (hasVerified.current) return
    hasVerified.current = true

    const verify = async () => {
      try {
        const response = await apiRequest<{ message: string; success: boolean }>(`/verify-email/${token}`)
        setStatus('success')
        setMessage(response.message)
        // Redirect ke login setelah 2 detik
        setTimeout(() => navigate('/login'), 2000)
      } catch (verifyError) {
        const text = verifyError instanceof Error ? verifyError.message : 'Verifikasi gagal'
        setStatus('error')
        setMessage(text)
      }
    }

    void verify()
  }, [token, navigate])

  return (
    <main className="screen">
      <section className="card">
        <h1>Verifikasi Email</h1>
        <p>{message}</p>
        {status !== 'loading' && (
          <p>
            <Link to="/login">Kembali ke halaman login</Link>
          </p>
        )}
      </section>
    </main>
  )
}
