import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Code2, Monitor, Users, Shield, Zap, CheckCircle2 } from 'lucide-react'

export function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CodeExam</span>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <Link 
                to="/" 
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg shadow-lg shadow-cyan-900/30 transition-all duration-300"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="px-5 py-2.5 text-slate-300 hover:text-white font-medium transition-colors"
                >
                  Masuk
                </Link>
                <Link 
                  to="/register" 
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg shadow-lg shadow-cyan-900/30 transition-all duration-300"
                >
                  Daftar Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            Platform Ujian Coding Online
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Ujian Coding
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-600">
              Lebih Modern
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Platform ujian pemrograman dengan editor real-time, preview langsung, 
            dan sistem monitoring canggih untuk dosen dan mahasiswa.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-900/30 transition-all duration-300 hover:scale-105"
            >
              Mulai Sekarang
            </Link>
            <Link 
              to="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold rounded-xl border border-slate-700/50 transition-all duration-300"
            >
              Sudah Punya Akun
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Semua yang Anda butuhkan untuk mengelola ujian pemrograman dengan efektif
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Card 1 */}
            <div className="group p-6 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl hover:border-cyan-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                <Code2 className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Code Editor</h3>
              <p className="text-slate-400 leading-relaxed">
                Editor kode dengan syntax highlighting, auto-completion, dan dukungan multi-file untuk HTML, CSS, dan JavaScript.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="group p-6 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl hover:border-cyan-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                <Monitor className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Live Preview</h3>
              <p className="text-slate-400 leading-relaxed">
                Lihat hasil kode secara real-time dengan preview responsif untuk mobile, tablet, dan desktop.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="group p-6 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl hover:border-cyan-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Manajemen Kelas</h3>
              <p className="text-slate-400 leading-relaxed">
                Buat dan kelola kelas dengan mudah. Undang mahasiswa menggunakan kode kelas unik.
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="group p-6 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl hover:border-cyan-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Anti-Cheat</h3>
              <p className="text-slate-400 leading-relaxed">
                Sistem keamanan dengan deteksi tab switch, blokir paste, dan monitoring aktivitas peserta.
              </p>
            </div>

            {/* Feature Card 5 */}
            <div className="group p-6 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl hover:border-cyan-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                <Monitor className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-time Monitor</h3>
              <p className="text-slate-400 leading-relaxed">
                Pantau progress peserta ujian secara real-time. Lihat status dan warning setiap peserta.
              </p>
            </div>

            {/* Feature Card 6 */}
            <div className="group p-6 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl hover:border-cyan-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                <CheckCircle2 className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Review & Nilai</h3>
              <p className="text-slate-400 leading-relaxed">
                Review jawaban peserta dengan mudah. Berikan nilai dan feedback langsung di platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 md:p-12 bg-gradient-to-br from-cyan-600/20 to-slate-900/40 backdrop-blur-xl border border-cyan-500/30 rounded-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Siap Memulai?
            </h2>
            <p className="text-slate-300 max-w-xl mx-auto mb-8">
              Daftarkan diri Anda sekarang dan nikmati kemudahan mengelola ujian pemrograman online.
            </p>
            <Link 
              to="/register" 
              className="inline-flex px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-900/30 transition-all duration-300 hover:scale-105"
            >
              Daftar Gratis Sekarang
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-400 font-medium">CodeExam</span>
          </div>
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} CodeExam. Platform Ujian Coding Online.
          </p>
        </div>
      </footer>
    </div>
  )
}
