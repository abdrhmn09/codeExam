import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'

type ClassItem = {
  id: string
  name: string
  inviteCode?: string
  teacher?: {
    id: string
    name: string | null
    npm: string | null
    email: string
  }
}

type ClassesResponse = {
  teaching: ClassItem[]
  joined: ClassItem[]
}

export function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [teachingClasses, setTeachingClasses] = useState<ClassItem[]>([])
  const [joinedClasses, setJoinedClasses] = useState<ClassItem[]>([])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await apiRequest<ClassesResponse>('/api/classes')
        setTeachingClasses(data.teaching)
        setJoinedClasses(data.joined)
      } catch (err) {
        console.error(err)
      }
    }
    void fetchClasses()
  }, [])

  return (
    <main className="screen" style={{ flexDirection: 'column', padding: '2rem', justifyContent: 'flex-start' }}>
      <header style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
           <h1>Dashboard</h1>
           <p>Login sebagai: {user?.name || '-'} (NPM: {user?.npm || '-'})</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button type="button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <section style={{ width: '100%', maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
           <h2>Aktivitas Kelas</h2>
           <div style={{ display: 'flex', gap: '0.5rem' }}>
             <Link to="/classes/create" className="btn" style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>+ Buat Kelas</Link>
             <Link to="/classes/join" className="btn" style={{ padding: '0.5rem 1rem', background: '#16a34a', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>+ Ikuti Kelas</Link>
           </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Kelas yang Diajar</h3>
          {teachingClasses.length === 0 ? (
            <p>Belum ada kelas yang Anda ajar.</p>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {teachingClasses.map((cls) => (
                <Link to={`/classes/${cls.id}`} key={cls.id} style={{ display: 'block', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', textDecoration: 'none', color: 'inherit', width: 'calc(50% - 0.5rem)' }}>
                  <h3>{cls.name}</h3>
                  {cls.inviteCode && (
                    <p style={{ fontSize: '0.9rem', color: '#555' }}>
                      Kode Invite: <strong>{cls.inviteCode}</strong>
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Kelas yang Diikuti</h3>
          {joinedClasses.length === 0 ? (
            <p>Belum ada kelas yang Anda ikuti.</p>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {joinedClasses.map((cls) => (
                <Link to={`/classes/${cls.id}`} key={cls.id} style={{ display: 'block', border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', textDecoration: 'none', color: 'inherit', width: 'calc(50% - 0.5rem)' }}>
                  <h3>{cls.name}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#555' }}>
                     Pengajar: {cls.teacher?.name || cls.teacher?.email}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
