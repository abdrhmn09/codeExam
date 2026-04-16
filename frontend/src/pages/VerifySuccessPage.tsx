import { Link } from 'react-router-dom'

export function VerifySuccessPage() {
  return (
    <main className="screen">
      <section className="card">
        <h1>✓ Email Berhasil Diverifikasi</h1>
        <p>Akun Anda siap digunakan. Silakan login untuk melanjutkan.</p>
        <p>
          <Link to="/login">Ke halaman login</Link>
        </p>
      </section>
    </main>
  )
}