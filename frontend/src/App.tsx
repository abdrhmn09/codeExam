import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { VerifySuccessPage } from './pages/VerifySuccessPage'
import { ClassCreatePage } from './pages/ClassCreatePage'
import { ClassJoinPage } from './pages/ClassJoinPage'
import { ClassDetailsPage } from './pages/ClassDetailsPage'
import { ExamCreatePage } from './pages/ExamCreatePage'
import { ExamEditorPage } from './pages/ExamEditorPage'
import { ExamMonitorPage } from './pages/ExamMonitorPage'

function App() {
  const { isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <div className="screen">Memuat sesi...</div>
  }

  return (
    <Routes>
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/verify-success" element={<VerifySuccessPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/create"
        element={
          <ProtectedRoute>
            <ClassCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/join"
        element={
          <ProtectedRoute>
            <ClassJoinPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/:id"
        element={
          <ProtectedRoute>
            <ClassDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/:classId/exams/create"
        element={
          <ProtectedRoute>
            <ExamCreatePage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/exams/:examId/editor"
        element={
          <ProtectedRoute>
            <ExamEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exams/:examId/monitor"
        element={
          <ProtectedRoute>
            <ExamMonitorPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
