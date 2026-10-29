import { api } from '@/lib/api'

export interface WorkSchedule {
  id: string
  employeeId: string
  startTime: string
  endTime: string
  lateTolerance: number
  breaksPerDay: number
  days: number[]
}

export async function getWorkSchedule() {
  const { data } = await api.get<WorkSchedule>('/employees/work-schedule')
  return data
}
