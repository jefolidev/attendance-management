import { api } from '@/lib/api'
import type { LoginResponse } from '@/features/auth/auth-types'

export async function login(username: string, password: string) {
  const { data } = await api.post<LoginResponse>('/login', { username, password })
  return data
}

export async function logout() {
  await api.post('/logout')
}
