import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { login as loginRequest } from '@/services/auth-service'
import { clearSession, getStoredEmployee, getStoredToken, storeSession } from './auth-storage'
import type { Employee } from './auth-types'
import { AuthContext, type AuthContextValue } from './auth-context-value'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(getStoredEmployee)
  const isAuthenticated = Boolean(employee && getStoredToken())

  const logout = () => {
    clearSession()
    setEmployee(null)
  }

  useEffect(() => {
    const handleExpiredSession = () => logout()
    window.addEventListener('ponto-digital:auth-expired', handleExpiredSession)

    return () => window.removeEventListener('ponto-digital:auth-expired', handleExpiredSession)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      employee,
      isAuthenticated,
      login: async (username, password) => {
        const response = await loginRequest(username, password)
        storeSession(response.accessToken, response.employee)
        setEmployee(response.employee)
      },
      logout,
    }),
    [employee, isAuthenticated],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

