import { api } from '@/lib/api'
import type { SortDirection } from '@/lib/sorting'

export type TimeEntryStage = 'clocked-in' | 'clocked-out' | 'on-break'

export interface TimeEntryBreak {
  start: string
  end: string | null
}

export interface DayEntry {
  timeEntryStage: TimeEntryStage
  occurredAt: string
  clockOut: string | null
  breaks: TimeEntryBreak[]
  totalBreakMinutes: number
  entryMinutesEarly: number
  entryMinutesLate: number
  departureMinutesEarly: number
  departureMinutesLate: number
  totalWorkedMinutes: number
}

export interface Pagination {
  page: number
  perPage: number
  hasNextPage: boolean
  sort: SortDirection
}

export interface EntriesResponse {
  entries: Array<Record<string, DayEntry>>
  pagination: Pagination
}

export interface TimeEntryActionResponse {
  timeEntryId: string
}

export async function getEntries(page = 1, perPage = 100, sort: SortDirection = 'desc') {
  const { data } = await api.get<EntriesResponse>('/employees/time-entries', {
    params: { page, perPage, sort },
  })
  return data
}

export async function registerTimeIn() {
  const { data } = await api.post<TimeEntryActionResponse>('/employees/time-entries/in', {
    clockIn: new Date().toISOString(),
  })
  return data
}

export async function toggleBreak() {
  const { data } = await api.post<TimeEntryActionResponse>('/employees/time-entries/break', {
    breakIn: new Date().toISOString(),
  })
  return data
}

export async function registerTimeOut() {
  const { data } = await api.post<TimeEntryActionResponse>('/employees/time-entries/out', {
    clockOut: new Date().toISOString(),
  })
  return data
}
