import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiRequest } from '../lib/api'

type AttemptData = {
  attempt: {
    id: string
    status: string
    startTime: string
    submittedAt: string | null
    code: string | null // Akan memuat struktur JSON
    warningCount: number
  }
  serverTime: string
}

type FileNode = {
  path: string
  type: 'file' | 'folder'
  content: string
}

const defaultFileSystem: FileNode[] = [
  { path: 'index.html', type: 'file', content: '<!DOCTYPE html>\n<html>\n<head>\n</head>\n<body>\n  <h1>Hello Code Editor!</h1>\n</body>\n</html>' },
  { path: 'style.css', type: 'file', content: 'body {\n  font-family: sans-serif;\n  background: #fafafa;\n  margin: 2rem;\n}\n\nh1 {\n  color: #2563eb;\n}' },
  { path: 'script.js', type: 'file', content: 'console.log("Hai dari JavaScript!");' }
]

export function ExamEditorPage() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  
  const [exam, setExam] = useState<any>(null)
  const [attempt, setAttempt] = useState<AttemptData['attempt'] | null>(null)
  
  // State File System & Editor
  const [fileSystem, setFileSystem] = useState<FileNode[]>(defaultFileSystem)
  const [activeFile, setActiveFile] = useState<string>('index.html')
  const [showPreview, setShowPreview] = useState<boolean>(true)
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Context Menu State untuk Right-Click (Create File/Folder per directory)
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, path: string, type: 'file' | 'folder' | 'root' } | null>(null)

  const isSaving = useRef(false)

  useEffect(() => {
    // Tutup context menu jika klik di tempat lain
    const handleClickWindow = () => setContextMenu(null)
    window.addEventListener('click', handleClickWindow)
    return () => window.removeEventListener('click', handleClickWindow)
  }, [])

  useEffect(() => {
    // Muat data exam
    apiRequest<any>(`/api/exams/${examId}`)
      .then(res => {
        setExam(res)
            if (res.attempt) {
               setAttempt(res.attempt)
            }
        // Kalau sudah ada attempt sebelumnya, muat code ke file sistem
        if (res.attempt && res.attempt.code) {
           try {
              const parsed = JSON.parse(res.attempt.code)
              if (Array.isArray(parsed)) {
                setFileSystem(parsed)
                const firstF = parsed.find(f => f.type === 'file')
                if (firstF) setActiveFile(firstF.path)
              }
           } catch {
              // Jika data lama tidak berbentuk JSON, masukkan ke main.txt
              setFileSystem([{ path: 'main.txt', type: 'file', content: res.attempt.code }])
              setActiveFile('main.txt')
           }
        }
      })
      .catch(err => setError(err.message))
  }, [examId])

  useEffect(() => {
    // Mulai attempt saat masuk ujian
    if (!exam || error || (exam.attempt && exam.attempt.status === 'SUBMITTED')) return
    
    apiRequest<AttemptData>(`/api/exams/${examId}/attempt`, { method: 'POST' })
      .then(res => {
        setAttempt(res.attempt)
        if (res.attempt.code) {
           try {
              const parsed = JSON.parse(res.attempt.code)
              if (Array.isArray(parsed)) {
                setFileSystem(parsed)
                const firstF = parsed.find(f => f.type === 'file')
                if (firstF) setActiveFile(firstF.path)
              }
           } catch {
              setFileSystem([{ path: 'main.txt', type: 'file', content: res.attempt.code }])
              setActiveFile('main.txt')
           }
        }

        // Kalkulasi waktu tersisa
        const tInterval = setInterval(() => {
           let endBoundary = new Date(exam.endTime).getTime()
           
           if (exam.durationLimit) {
              const startT = new Date(res.attempt.startTime).getTime()
              const limitEnd = startT + exam.durationLimit * 60 * 1000
              if (limitEnd < endBoundary) {
                 endBoundary = limitEnd
              }
           }

           const now = Date.now() // (Ideanya sync server, tapi ini ok untuk MVP)
           const diff = Math.max(0, Math.floor((endBoundary - now) / 1000))
           setTimeLeft(diff)

           if (diff <= 0) {
              clearInterval(tInterval)
              handleSubmit(true)
           }
        }, 1000)

        return () => clearInterval(tInterval)
      })
      .catch(err => setError(err.message))
  }, [exam, examId])

  useEffect(() => {
     // Antisipasi tab switch -> Pemicu Peringatan
     const handleVisibilityChange = () => {
         if (document.hidden && attempt && attempt.status === 'ONGOING') {
            apiRequest(`/api/exams/${examId}/warning`, { method: 'POST' }).catch(console.error)
            alert('PERINGATAN: Anda dilarang meninggalkan halaman saat ujian berlangsung!')
         }
     }
     document.addEventListener('visibilitychange', handleVisibilityChange)
     return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [attempt, examId])

  const handleSubmit = async (final = false) => {
    if (isSaving.current) return
    isSaving.current = true
    try {
      const payloadCode = JSON.stringify(fileSystem)
      const res = await apiRequest<{ status: string }>(`/api/exams/${examId}/submit`, {
         method: 'POST',
         body: { code: payloadCode, isSubmit: final }
      })
      if (res.status === 'SUBMITTED') {
         setAttempt(prev => prev ? { ...prev, status: 'SUBMITTED' } : null)
         alert('Ujian berhasil diselesaikan')
         navigate(-1)
      }
    } catch(err: any) {
      alert(`Gagal menyimpan: ${err.message}`)
    } finally {
       setTimeout(() => { isSaving.current = false }, 500)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
     e.preventDefault()
     alert('DILARANG PASTE: Ketik solusi Anda sendiri.')
  }

  const handleAddFile = (basePath: string = '') => {
     const name = prompt(basePath ? `Nama File di dalam folder '${basePath}':` : "Nama File (contoh: style.css atau folder/app.js):")
     if (!name) return
     const fullPath = basePath ? `${basePath}/${name}` : name
     if (fileSystem.find(f => f.path === fullPath)) return alert("File sudah ada")
     setFileSystem([...fileSystem, { path: fullPath, type: 'file' as const, content: '' }].sort((a,b) => a.path.localeCompare(b.path)))
     setActiveFile(fullPath)
  }

  const handleAddFolder = (basePath: string = '') => {
     const name = prompt(basePath ? `Nama Folder di dalam '${basePath}':` : "Nama Folder (contoh: assets atau src/components):")
     if (!name) return
     const fullPath = basePath ? `${basePath}/${name}` : name
     if (fileSystem.find(f => f.path === fullPath)) return alert("Path sudah ada")
     setFileSystem([...fileSystem, { path: fullPath, type: 'folder' as const, content: '' }].sort((a,b) => a.path.localeCompare(b.path)))
  }

  const handleContextMenuAction = (action: 'file' | 'folder' | 'delete') => {
     if (!contextMenu) return
     
     if (action === 'delete') {
        if (contextMenu.type === 'root') return
        if (confirm(`Yakin ingin menghapus '${contextMenu.path}'?`)) {
           setFileSystem(prev => prev.filter(f => f.path !== contextMenu.path && !f.path.startsWith(contextMenu.path + '/')))
           if (activeFile === contextMenu.path || activeFile.startsWith(contextMenu.path + '/')) {
              setActiveFile('')
           }
        }
        return
     }

     let base = ''
     if (contextMenu.type === 'file') {
       const parts = contextMenu.path.split('/')
       parts.pop() // Ambil folder perental dari file
       base = parts.join('/')
     } else if (contextMenu.type === 'folder') {
       base = contextMenu.path
     }
     
     if (action === 'file') handleAddFile(base)
     else handleAddFolder(base)
  }

  // Engine Preview Gabungan HTML/CSS/JS
  const generatePreview = () => {
      const htmlContent = fileSystem.find(f => f.path.endsWith('.html'))?.content || ''
      const cssContent = fileSystem.filter(f => f.path.endsWith('.css')).map(f => f.content).join('\n')
      const jsContent = fileSystem.filter(f => f.path.endsWith('.js')).map(f => f.content).join('\n')
      
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <style>${cssContent}</style>
          </head>
          <body>
            ${htmlContent}
            <script>
              try {
                ${jsContent}
              } catch (err) {
                console.error(err);
              }
            </script>
          </body>
        </html>
      `
  }

  if (error) return <div className="screen">{error}</div>
   const isSubmitted = attempt?.status === 'SUBMITTED'
   if (!exam || (!isSubmitted && attempt && timeLeft === null)) return <div className="screen">Menyiapkan Ujian...</div>

  const activeFileObj = fileSystem.find(f => f.path === activeFile)

  const formatSecs = (s: number) => {
     const m = Math.floor(s / 60)
     const sc = s % 60
     return `${m}:${sc < 10 ? '0' : ''}${sc}`
  }

  return (
    <main style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#fff' }}>
       {/* ---------------- INFO & WAKTU (Kiri) ---------------- */}
       <div style={{ width: '20%', minWidth: '220px', padding: '1.5rem', borderRight: '1px solid #e2e8f0', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '1.2rem', marginTop: 0 }}>{exam.title}</h2>
          <div>
            <h3 style={{ fontSize: '1rem', color: '#64748b' }}>Sisa Waktu:</h3>
            <div style={{ fontSize: '2rem', color: (timeLeft || 0) < 300 ? '#ef4444' : '#0f172a', fontWeight: 'bold' }}>
               {isSubmitted ? 'Selesai' : (timeLeft !== null ? formatSecs(timeLeft) : '--:--')}
            </div>
            <hr style={{ margin: '1rem 0', borderColor: '#e2e8f0' }}/>
            <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: '#334155' }}>
               {exam.description || 'Selesaikan kode Anda sesuai instruksi, hati-hati tab otomatis terlacak.'}
            </p>
          </div>
       </div>

       {/* ---------------- BUILDER IDE (Tengah) ---------------- */}
       <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* HEADER AKSI */}
          <header style={{ padding: '0.75rem 1.5rem', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
             <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowPreview(!showPreview)} style={{ background: showPreview ? '#10b981' : '#64748b', color: 'white', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                   {showPreview ? 'Tutup Preview' : 'Buka Preview'}
                </button>
             </div>
             <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!isSubmitted && <button onClick={() => handleSubmit(false)} style={{ background: '#f1f5f9', color: '#475569', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Simpan Draft</button>}
                {!isSubmitted && <button onClick={() => handleSubmit(true)} style={{ background: '#2563eb', color: 'white', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Akhiri Ujian</button>}
                {isSubmitted && <button onClick={() => navigate(-1)} style={{ background: '#f1f5f9', color: '#475569', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Keluar</button>}
             </div>
          </header>

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
             
             {/* FILE EXPLORER BAR */}
             <div 
               style={{ width: '200px', background: '#f1f5f9', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}
               onContextMenu={(e) => {
                  e.preventDefault()
                  setContextMenu({ x: e.pageX, y: e.pageY, path: '', type: 'root' })
               }}
             >
                <div style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748b' }}>FILES</span>
                   <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => handleAddFile('')} disabled={isSubmitted} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', padding: '2px', height: 'auto', fontSize: '1rem' }} title="New File">📄+</button>
                      <button onClick={() => handleAddFolder('')} disabled={isSubmitted} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', padding: '2px', height: 'auto', fontSize: '1rem' }} title="New Folder">📁+</button>
                   </div>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', paddingTop: '0.5rem' }}>
                   {fileSystem.map(item => {
                     const parts = item.path.split('/')
                     const depth = Math.max(0, parts.length - 1)
                     const name = parts[parts.length - 1]
                     const isActive = activeFile === item.path
                     
                     return (
                       <div 
                         key={item.path} 
                         onClick={() => item.type === 'file' && setActiveFile(item.path)}
                         onContextMenu={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setContextMenu({ x: e.pageX, y: e.pageY, path: item.path, type: item.type })
                         }}
                         style={{ 
                           padding: `0.3rem 0.5rem 0.3rem ${depth * 15 + 10}px`,
                           cursor: item.type === 'file' ? 'pointer' : 'context-menu',
                           background: isActive ? '#e0f2fe' : 'transparent',
                           fontWeight: item.type === 'folder' ? 'bold' : 'normal',
                           fontSize: '0.85rem',
                           color: isActive ? '#0369a1' : '#334155'
                         }}
                       >
                         <span style={{ marginRight: '6px' }}>{item.type === 'folder' ? '📁' : '📄'}</span> {name}
                       </div>
                     )
                   })}
                </div>
             </div>

             {/* TEXTAREA / EDITOR BAR */}
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
                <div style={{ background: '#f8fafc', padding: '0.4rem 1rem', fontSize: '0.85rem', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                  Path: {activeFile || 'Pilih File'}
                </div>
                <textarea
                  value={activeFileObj?.content || ''}
                  onChange={e => {
                     const val = e.target.value
                     setFileSystem(prev => prev.map(f => f.path === activeFile ? { ...f, content: val } : f))
                  }}
                  onPaste={handlePaste}
                  disabled={isSubmitted || !activeFileObj}
                  style={{ 
                     flex: 1, padding: '1rem', fontFamily: '"Consolas", "Courier New", monospace', 
                     fontSize: '1rem', resize: 'none', border: 'none', outline: 'none',
                     background: (isSubmitted || !activeFileObj) ? '#f8fafc' : 'white',
                     color: '#1e293b',
                     lineHeight: '1.5'
                  }}
                  placeholder="Ketik kode program di sini..."
                  spellCheck={false}
                />
             </div>
          </div>
       </div>

       {/* ---------------- LIVE PREVIEW (Kanan, Toggle-able) ---------------- */}
       {showPreview && (
          <div style={{ width: '35%', minWidth: '350px', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#fff' }}>
             <div style={{ padding: '0.5rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 'bold', color: '#475569' }}>
               Live HTML Preview
             </div>
             <iframe 
               title="Preview"
               srcDoc={generatePreview()} 
               style={{ flex: 1, border: 'none', background: 'white', width: '100%' }} 
             />
          </div>
       )}

       {/* ---------------- CONTEXT MENU OVERLAY ---------------- */}
       {contextMenu && !isSubmitted && (
           <div style={{
              position: 'fixed', top: contextMenu.y, left: contextMenu.x,
              background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 9999, padding: '0.5rem 0', minWidth: '180px', borderRadius: '6px'
           }}>
              <div 
                 style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', color: '#1e293b' }} 
                 onClick={() => handleContextMenuAction('file')}
                 onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                 onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                 New File...
              </div>
              <div 
                 style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', color: '#1e293b' }} 
                 onClick={() => handleContextMenuAction('folder')}
                 onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                 onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                 New Folder...
              </div>
              {contextMenu.type !== 'root' && (
                  <div 
                     style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem', color: '#ef4444' }} 
                     onClick={() => handleContextMenuAction('delete')}
                     onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
                     onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                     Delete
                  </div>
              )}
           </div>
       )}
    </main>
  )
}
