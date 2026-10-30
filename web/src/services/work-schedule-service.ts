import { api } from '@/lib/api'

export interface WorkSchedule {
  id: string
  employeeId: string
  startTime: string
  endTime: string
  breakStartTime: string | null
  breakEndTime: string | null
  lateTolerance: number
  breaksPerDay: number
  days: number[]
}

export async function getWorkSchedule() {
  const { data } = await api.get<WorkSchedule>('/employees/work-schedule')
  return data
}

export async function updateWorkSchedule(payload: Partial<Pick<WorkSchedule, 'startTime' | 'endTime' | 'breakStartTime' | 'breakEndTime'>>) {
  await api.patch('/employees/work-schedule', payload)
}
