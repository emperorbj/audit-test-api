// Who is logged in. The token and user live in React state (memory) only.
//
//   const { user, login, logout } = useAuth()
//   <RequireAuth> ... </RequireAuth>          only for logged-in users
//   <RequireRole role="org_admin"> ...        only for admins

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { setAuthToken, setSessionExpiredHandler } from '../api/client'
import type { LoginResponse, Role, User } from '../api/types'
import { useToast } from '../components/ui/Toaster'

type AuthApi = {
  user: User | null
  login: (response: LoginResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthApi | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const queryClient = useQueryClient()
  const toast = useToast()

  const login = useCallback((response: LoginResponse) => {
    setAuthToken(response.access_token)
    setUser(response.user)
  }, [])

  const logout = useCallback(() => {
    setAuthToken(null)
    setUser(null)
    queryClient.clear() // forget every cached answer: the next user must not see them
  }, [queryClient])

  // When any request gets a 401 (expired login): log out and say why.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      logout()
      toast.error('Your session has ended. Please log in again.')
    })
  }, [logout, toast])

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthApi {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

// The logged-in user (only use inside <RequireAuth>, where there always is one).
export function useCurrentUser(): User {
  const { user } = useAuth()
  if (!user) throw new Error('useCurrentUser needs a logged-in user')
  return user
}

// Viewers may read investigations but not ask questions.
export const canAsk = (role: Role) => role === 'org_admin' || role === 'investigator'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) {
    // Remember where they were going, to send them back after login.
    const next = encodeURIComponent(location.pathname)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  return children
}

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth()
  if (user?.role !== role) return <Navigate to="/investigations" replace />
  return children
}
