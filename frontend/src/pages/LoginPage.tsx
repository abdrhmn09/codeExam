import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch (submitError) {
      const text = submitError instanceof Error ? submitError.message : 'Login gagal'
      setError(text)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="screen">
      <form className="card" onSubmit={onSubmit}>
        <h1>Login</h1>
        <p>Masuk menggunakan email dan password.</p>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        {error && <div className="alert error">{error}</div>}

        <button disabled={loading} type="submit">
          {loading ? 'Memproses...' : 'Masuk'}
        </button>

        <p>
          Belum punya akun? <Link to="/register">Register</Link>
        </p>
      </form>
    </main>
  )
}
