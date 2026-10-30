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
  dayOverrides: WorkScheduleDayOverride[]
}

export interface WorkScheduleDayOverride {
  dayOfWeek: number
  startTime?: string
  endTime?: string
}

export async function getWorkSchedule() {
  const { data, status } = await api.get<WorkSchedule | null>('/employees/work-schedule', {
    validateStatus: (responseStatus) => responseStatus === 200 || responseStatus === 404,
  })

  return status === 404 ? null : data
}

export async function createWorkSchedule(payload: Pick<WorkSchedule, 'startTime' | 'endTime' | 'lateTolerance' | 'breaksPerDay' | 'days' | 'dayOverrides'>) {
  await api.post('/employees/work-schedule', payload)
}

export async function updateWorkSchedule(payload: Partial<Pick<WorkSchedule, 'startTime' | 'endTime' | 'lateTolerance' | 'breaksPerDay' | 'days' | 'dayOverrides'>>) {
  await api.patch('/employees/work-schedule', payload)
}
