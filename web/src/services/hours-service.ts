import { api } from '@/lib/api'
import type { Pagination } from './timeclock-service'

export type TimeBalanceEntryType = 'CREDIT' | 'DEBIT'
export type TimeBalanceEntryReason =
  | 'LATE_ARRIVAL'
  | 'EARLY_DEPARTURE'
  | 'OVERTIME'
  | 'COMPENSATION'
  | 'EXTRA'
  | 'MANUAL_ADJUSTMENT'

export interface TimeBalanceEvent {
  employeeId: string
  timeBalanceId: string
  type: TimeBalanceEntryType
  reason: TimeBalanceEntryReason
  durationInMinutes: number
  createdAt: string
}

export interface BalanceResponse {
  balance: {
    id: string
    employeeId: string
    balanceMinutes: number
    updatedAt: string | null
    events: TimeBalanceEvent[]
  }
}

export interface BalanceEventsResponse {
  events: TimeBalanceEvent[]
  pagination: Pagination
}

export interface DelayResponse {
  totalLateMinutes: number
  compensatedMinutes: number
  uncompensatedMinutes: number
  days: DelayDay[]
  pagination: Pagination & { totalPages: number }
}

export interface DelayDay {
  date: string
  clockIn: string
  clockOut: string
  expectedTime: string
  lateMinutes: number
  reason: 'LATE_ARRIVAL'
  compensations: Array<{
    durationInMinutes: number
    reason: 'COMPENSATION'
  }>
}

export async function getBalance() {
  const { data } = await api.get<BalanceResponse>('/employees/time-balance')
  return data
}

export async function getBalanceEvents(page = 1, perPage = 20) {
  const { data } = await api.get<BalanceEventsResponse>('/employees/time-balance/events', {
    params: { page, perPage },
  })
  return data
}

export async function getAccumulatedDelay(page = 1, perPage = 10) {
  const { data } = await api.get<DelayResponse>('/employees/time-balance/accumulated-delay', {
    params: { page, perPage },
  })
  return data
}
