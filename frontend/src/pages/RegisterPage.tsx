import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const passwordHint = 'Minimal 8 karakter, mengandung huruf, angka, dan simbol'

export function RegisterPage() {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [npm, setNpm] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await register({ name, npm, email, password, confirmPassword })
      setMessage(response.message)
      setName('')
      setNpm('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    } catch (submitError) {
      const text = submitError instanceof Error ? submitError.message : 'Registrasi gagal'
      setError(text)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="screen">
      <form className="card" onSubmit={onSubmit}>
        <h1>Register</h1>
        <p>Buat akun dengan email untuk mengikuti kelas/lomba.</p>

        <label>
          Nama
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoComplete="name"
          />
        </label>

        <label>
          NPM
          <input
            type="text"
            value={npm}
            onChange={(event) => setNpm(event.target.value)}
            required
          />
        </label>

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
            autoComplete="new-password"
          />
        </label>

        <label>
          Konfirmasi Password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            autoComplete="new-password"
          />
        </label>

        <small>{passwordHint}</small>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <button disabled={loading} type="submit">
          {loading ? 'Memproses...' : 'Daftar'}
        </button>

        <p>
          Sudah punya akun? <Link to="/login">Login</Link>
        </p>
      </form>
    </main>
  )
}
