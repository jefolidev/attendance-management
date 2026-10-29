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

export async function getAccumulatedDelay() {
  const { data } = await api.get<DelayResponse>('/employees/time-balance/accumulated-delay')
  return data
}
