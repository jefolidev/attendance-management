import type { User } from './auth-types'

export const tokenKey = '@app:token'
const userKey = '@app:user'
const legacyTokenKey = 'ponto-digital:access-token'
const legacyUserKey = 'ponto-digital:employee'
const impersonatedUserKey = '@app:impersonated-user'

export function getStoredEmployee() {
  const value = localStorage.getItem(userKey) || localStorage.getItem(legacyUserKey)
  if (!value) return null

  try {
    return JSON.parse(value) as User
  } catch {
    localStorage.removeItem(userKey)
    localStorage.removeItem(legacyUserKey)
    return null
  }
}

export function getStoredToken() {
  const token = localStorage.getItem(tokenKey)
  if (token) return token

  const legacyToken = localStorage.getItem(legacyTokenKey)
  if (legacyToken) {
    localStorage.setItem(tokenKey, legacyToken)
    return legacyToken
  }

  return null
}

export function storeSession(token: string, user: User) {
  localStorage.setItem(tokenKey, token)
  localStorage.setItem(userKey, JSON.stringify(user))
  localStorage.removeItem(legacyTokenKey)
  localStorage.removeItem(legacyUserKey)
}

export function clearSession() {
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(userKey)
  localStorage.removeItem(legacyTokenKey)
  localStorage.removeItem(legacyUserKey)
  clearImpersonatedUser()
}

export function getImpersonatedUser() {
  const value = sessionStorage.getItem(impersonatedUserKey)
  if (!value) return null

  try {
    return JSON.parse(value) as User
  } catch {
    sessionStorage.removeItem(impersonatedUserKey)
    return null
  }
}

export function storeImpersonatedUser(user: User) {
  sessionStorage.setItem(impersonatedUserKey, JSON.stringify(user))
}

export function clearImpersonatedUser() {
  sessionStorage.removeItem(impersonatedUserKey)
}
