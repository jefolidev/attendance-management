import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { login as loginRequest } from '@/services/auth-service'
import {
  clearImpersonatedUser as clearStoredImpersonatedUser,
  clearSession,
  getImpersonatedUser,
  getStoredEmployee,
  getStoredToken,
  storeImpersonatedUser,
  storeSession,
} from './auth-storage'
import type { User } from './auth-types'
import { AuthContext, type AuthContextValue } from './auth-context-value'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredEmployee)
  const [impersonatedUser, setImpersonatedUserState] = useState<User | null>(getImpersonatedUser)
  const isAuthenticated = Boolean(user && getStoredToken())

  const logout = () => {
    clearSession()
    setUser(null)
    setImpersonatedUserState(null)
  }

  useEffect(() => {
    const handleExpiredSession = () => logout()
    window.addEventListener('ponto-digital:auth-expired', handleExpiredSession)

    return () => window.removeEventListener('ponto-digital:auth-expired', handleExpiredSession)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      employee: user,
      isAuthenticated,
      isAdmin: user?.role === 'ADMIN',
      login: async (username, password) => {
        const response = await loginRequest(username, password)
        storeSession(response.accessToken, response.employee)
        setUser(response.employee)
        setImpersonatedUserState(null)
        return response.employee
      },
      logout,
      impersonatedUser,
      setImpersonatedUser: (selectedUser) => {
        storeImpersonatedUser(selectedUser)
        setImpersonatedUserState(selectedUser)
      },
      clearImpersonatedUser: () => {
        clearStoredImpersonatedUser()
        setImpersonatedUserState(null)
      },
    }),
    [user, isAuthenticated, impersonatedUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

