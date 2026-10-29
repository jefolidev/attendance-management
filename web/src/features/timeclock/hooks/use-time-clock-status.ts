import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/formatters'
import {
  getEntries,
  registerTimeIn,
  registerTimeOut,
  toggleBreak,
  type DayEntry,
} from '@/services/timeclock-service'

export type TimeClockDayStatus = 'not-started' | 'working' | 'on-break' | 'completed'

interface LastAction {
  label: string
  occurredAt: Date
}

function getTodayEntry(entries: Array<Record<string, DayEntry>>) {
  const today = new Date().toLocaleDateString('pt-BR')

  return entries
    .flatMap((entry) => Object.values(entry))
    .find((entry) => new Date(entry.occurredAt).toLocaleDateString('pt-BR') === today) || null
}

export function useTimeClockStatus() {
  const queryClient = useQueryClient()
  const [lastAction, setLastAction] = useState<LastAction | null>(null)
  const entriesQuery = useQuery({
    queryKey: ['time-clock-status'],
    queryFn: () => getEntries(1, 100),
  })
  const todayEntry = useMemo(() => getTodayEntry(entriesQuery.data?.entries || []), [entriesQuery.data])

  const status: TimeClockDayStatus = todayEntry?.timeEntryStage === 'clocked-in'
    ? 'working'
    : todayEntry?.timeEntryStage === 'on-break'
      ? 'on-break'
      : todayEntry?.timeEntryStage === 'clocked-out'
        ? 'completed'
        : 'not-started'

  const invalidateTimeClock = () => {
    void queryClient.invalidateQueries({ queryKey: ['time-clock-status'] })
    void queryClient.invalidateQueries({ queryKey: ['time-entries'] })
    void queryClient.invalidateQueries({ queryKey: ['time-balance'] })
    void queryClient.invalidateQueries({ queryKey: ['balance-events'] })
    void queryClient.invalidateQueries({ queryKey: ['accumulated-delay'] })
  }

  const mutationOptions = (label: string) => ({
    onSuccess: () => {
      const occurredAt = new Date()
      setLastAction({ label, occurredAt })
      toast.success(`${label} às ${occurredAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`)
      invalidateTimeClock()
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  })

  const clockInMutation = useMutation({ mutationFn: registerTimeIn, ...mutationOptions('Entrada registrada') })
  const breakMutation = useMutation({
    mutationFn: toggleBreak,
    ...mutationOptions(status === 'on-break' ? 'Trabalho retomado' : 'Pausa iniciada'),
  })
  const clockOutMutation = useMutation({ mutationFn: registerTimeOut, ...mutationOptions('Saída registrada') })

  return {
    todayEntry,
    status,
    lastAction,
    isLoading: entriesQuery.isLoading,
    isError: entriesQuery.isError,
    refetch: entriesQuery.refetch,
    clockIn: () => clockInMutation.mutate(),
    toggleBreak: () => breakMutation.mutate(),
    clockOut: () => clockOutMutation.mutate(),
    isClockingIn: clockInMutation.isPending,
    isTogglingBreak: breakMutation.isPending,
    isClockingOut: clockOutMutation.isPending,
  }
}
