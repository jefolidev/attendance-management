import { createContext } from 'react'
import type { User } from './auth-types'

export interface AuthContextValue {
  user: User | null
  employee: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (username: string, password: string) => Promise<User>
  logout: () => void
  impersonatedUser: User | null
  setImpersonatedUser: (user: User) => void
  clearImpersonatedUser: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
