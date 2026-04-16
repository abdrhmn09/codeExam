import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './LandingPage.css'

// SVG Icons as components
const Code2Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m18 16 4-4-4-4"/>
    <path d="m6 8-4 4 4 4"/>
    <path d="m14.5 4-5 16"/>
  </svg>
)

const MonitorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="3" rx="2"/>
    <line x1="8" x2="16" y1="21" y2="21"/>
    <line x1="12" x2="12" y1="17" y2="21"/>
  </svg>
)

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
  </svg>
)

const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
  </svg>
)

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
)

export function LandingPage() {
  const { user } = useAuth()

  const features = [
    {
      icon: <Code2Icon />,
      title: 'Code Editor',
      description: 'Editor kode dengan syntax highlighting, auto-completion, dan dukungan multi-file untuk HTML, CSS, dan JavaScript.'
    },
    {
      icon: <MonitorIcon />,
      title: 'Live Preview',
      description: 'Lihat hasil kode secara real-time dengan preview responsif untuk mobile, tablet, dan desktop.'
    },
    {
      icon: <UsersIcon />,
      title: 'Manajemen Kelas',
      description: 'Buat dan kelola kelas dengan mudah. Undang mahasiswa menggunakan kode kelas unik.'
    },
    {
      icon: <ShieldIcon />,
      title: 'Anti-Cheat',
      description: 'Sistem keamanan dengan deteksi tab switch, blokir paste, dan monitoring aktivitas peserta.'
    },
    {
      icon: <MonitorIcon />,
      title: 'Real-time Monitor',
      description: 'Pantau progress peserta ujian secara real-time. Lihat status dan warning setiap peserta.'
    },
    {
      icon: <CheckCircleIcon />,
      title: 'Review & Nilai',
      description: 'Review jawaban peserta dengan mudah. Berikan nilai dan feedback langsung di platform.'
    }
  ]

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <div className="brand-icon">
              <Code2Icon />
            </div>
            <span className="brand-text">CodeExam</span>
          </div>
          
          <div className="nav-actions">
            {user ? (
              <Link to="/" className="btn btn-primary">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  Masuk
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Daftar Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge">
            <ZapIcon />
            <span>Platform Ujian Coding Online</span>
          </div>
          
          <h1 className="hero-title">
            Ujian Coding
            <span className="hero-title-accent">Lebih Modern</span>
          </h1>
          
          <p className="hero-description">
            Platform ujian pemrograman dengan editor real-time, preview langsung, 
            dan sistem monitoring canggih untuk dosen dan mahasiswa.
          </p>
          
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-large">
              Mulai Sekarang
            </Link>
            <Link to="/login" className="btn btn-secondary btn-large">
              Sudah Punya Akun
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="features-header">
            <h2 className="features-title">Fitur Unggulan</h2>
            <p className="features-subtitle">
              Semua yang Anda butuhkan untuk mengelola ujian pemrograman dengan efektif
            </p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-card">
            <h2 className="cta-title">Siap Memulai?</h2>
            <p className="cta-description">
              Daftarkan diri Anda sekarang dan nikmati kemudahan mengelola ujian pemrograman online.
            </p>
            <Link to="/register" className="btn btn-primary btn-large">
              Daftar Gratis Sekarang
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="brand-icon brand-icon-small">
              <Code2Icon />
            </div>
            <span>CodeExam</span>
          </div>
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} CodeExam. Platform Ujian Coding Online.
          </p>
        </div>
      </footer>
    </div>
  )
}
