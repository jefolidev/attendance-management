import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { login as loginRequest, logout as logoutRequest } from '@/services/auth-service'
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
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(getStoredEmployee)
  const [impersonatedUser, setImpersonatedUserState] = useState<User | null>(getImpersonatedUser)
  const isAuthenticated = Boolean(user && getStoredToken())

  const clearLocalSession = useCallback(() => {
    queryClient.clear()
    clearSession()
    setUser(null)
    setImpersonatedUserState(null)
  }, [queryClient])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      clearLocalSession()
    }
  }, [clearLocalSession])

  useEffect(() => {
    const handleExpiredSession = () => clearLocalSession()
    window.addEventListener('ponto-digital:auth-expired', handleExpiredSession)

    return () => window.removeEventListener('ponto-digital:auth-expired', handleExpiredSession)
  }, [clearLocalSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      employee: user,
      isAuthenticated,
      isAdmin: user?.role === 'ADMIN',
      login: async (username, password) => {
        const response = await loginRequest(username, password)
        queryClient.clear()
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
    [user, isAuthenticated, impersonatedUser, queryClient, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

