import type { Employee } from './auth-types'

const tokenKey = 'ponto-digital:access-token'
const employeeKey = 'ponto-digital:employee'

export function getStoredEmployee() {
  const value = localStorage.getItem(employeeKey)
  if (!value) return null

  try {
    return JSON.parse(value) as Employee
  } catch {
    localStorage.removeItem(employeeKey)
    return null
  }
}

export function getStoredToken() {
  return localStorage.getItem(tokenKey)
}

export function storeSession(token: string, employee: Employee) {
  localStorage.setItem(tokenKey, token)
  localStorage.setItem(employeeKey, JSON.stringify(employee))
}

export function clearSession() {
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(employeeKey)
}
