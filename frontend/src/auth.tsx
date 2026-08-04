import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { MeResponse } from './api'
import { clearToken, getMe, getToken, login as apiLogin, setToken, signup as apiSignup } from './api'

interface AuthContextValue {
  user: MeResponse | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)

  async function refreshUser(): Promise<void> {
    const me = await getMe()
    setUser(me)
  }

  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    // A 401 here is handled globally by the response interceptor in api.ts
    // (clears the token and redirects to /login); this just keeps local state in sync.
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string): Promise<void> {
    const token = await apiLogin(email, password)
    setToken(token)
    await refreshUser()
  }

  async function signup(email: string, password: string): Promise<void> {
    const token = await apiSignup(email, password)
    setToken(token)
    await refreshUser()
  }

  function logout(): void {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="page-loading">Loading...</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}
