import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api'
import type { User } from '../types/auth'

type RegisterPayload = {
  name: string
  npm: string
  email: string
  password: string
  confirmPassword: string
}

type AuthContextValue = {
  user: User | null
  isBootstrapping: boolean
  register: (payload: RegisterPayload) => Promise<{ message: string }>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiRequest<{ user: User }>('/api/auth/me')
      setUser(response.user)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await refreshUser()
      setIsBootstrapping(false)
    }

    void init()
  }, [refreshUser])

  const register = useCallback(async (payload: RegisterPayload) => {
    return apiRequest<{ message: string }>('/api/auth/register', {
      method: 'POST',
      body: payload,
    })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiRequest<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })

    setUser(response.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isBootstrapping,
      register,
      login,
      logout,
      refreshUser,
    }),
    [user, isBootstrapping, register, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider')
  }

  return context
}
