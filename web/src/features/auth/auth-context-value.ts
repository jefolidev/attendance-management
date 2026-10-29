import { createContext } from 'react'
import type { Employee } from './auth-types'

export interface AuthContextValue {
  employee: Employee | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
