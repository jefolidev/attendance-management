import { api } from '@/lib/api'
import type { SortDirection } from '@/lib/sorting'
import type { DayEntry, EntriesResponse, Pagination } from './timeclock-service'
import type { BalanceResponse, DelayResponse } from './hours-service'
import type { WorkSchedule } from './work-schedule-service'

export interface AdminEmployee {
  id: string
  username: string
  role: 'ADMIN' | 'EMPLOYEE'
  createdAt: string
  updatedAt: string | null
}

export interface AdminEmployeesResponse {
  employees: AdminEmployee[]
  pagination: Pagination & { totalPages: number }
}

export interface AdminEntriesResponse extends EntriesResponse {
  employeeId?: string
}

export async function getAdminEmployees(page = 1, perPage = 20, sort: SortDirection = 'desc') {
  const { data } = await api.get<AdminEmployeesResponse>('/admin/employees', {
    params: { page, perPage, sort },
  })
  return data
}

export async function createAdminEmployee(payload: { username: string; password: string; role: AdminEmployee['role'] }) {
  const { data } = await api.post<{ employeeId: string }>('/admin/employees', payload)
  return data
}

export async function updateEmployeePassword(employeeId: string, password: string) {
  await api.patch(`/admin/employees/${employeeId}/password`, { password })
}

export async function getAdminEmployeeEntries(employeeId: string, page = 1, perPage = 10, sort: SortDirection = 'desc') {
  const { data } = await api.get<AdminEntriesResponse>(`/admin/employees/${employeeId}/time-entries`, {
    params: { page, perPage, sort },
  })
  return data
}

export async function getAdminEmployeeBalance(employeeId: string) {
  const { data } = await api.get<BalanceResponse | { balance: null }>(`/admin/employees/${employeeId}/time-balance`)
  return data
}

export async function getAdminEmployeeDelays(employeeId: string, page = 1, perPage = 10, sort: SortDirection = 'desc') {
  const { data } = await api.get<DelayResponse>(`/admin/employees/${employeeId}/delays`, {
    params: { page, perPage, sort },
  })
  return data
}

export async function getAdminEmployeeWorkSchedule(employeeId: string) {
  const { data } = await api.get<WorkSchedule | null>(`/admin/employees/${employeeId}/work-schedule`)
  return data
}

export async function updateAdminEmployeeWorkSchedule(employeeId: string, payload: Partial<Pick<WorkSchedule, 'startTime' | 'endTime' | 'breakStartTime' | 'breakEndTime' | 'lateTolerance' | 'breaksPerDay' | 'days' | 'dayOverrides'>>) {
  await api.patch(`/admin/employees/${employeeId}/work-schedule`, payload)
}

export type AdminEntry = DayEntry
