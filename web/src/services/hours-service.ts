import { api } from '@/lib/api'
import type { Pagination } from './timeclock-service'
import type { SortDirection } from '@/lib/sorting'

export type TimeBalanceEntryType = 'CREDIT' | 'DEBIT'
export type BalanceEventClockType = 'CLOCK_IN' | 'CLOCK_OUT' | 'OTHER'
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
  timeEntryId: string | null
  clockType: BalanceEventClockType
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

export async function getBalanceEvents(page = 1, perPage = 20, sort: SortDirection = 'desc') {
  const { data } = await api.get<BalanceEventsResponse>('/employees/time-balance/events', {
    params: { page, perPage, sort },
  })
  return data
}

export async function getAccumulatedDelay(page = 1, perPage = 10, sort: SortDirection = 'desc') {
  const { data } = await api.get<DelayResponse>('/employees/time-balance/accumulated-delay', {
    params: { page, perPage, sort },
  })
  return data
}
