import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { TimeClockAction } from '@/features/timeclock/components/time-clock-action'
import { TodayRecords } from '@/features/timeclock/components/today-records'
import { getErrorMessage, formatDate } from '@/lib/formatters'
import { getWorkSchedule } from '@/services/work-schedule-service'
import { getEntries, registerTimeIn, registerTimeOut, toggleBreak, type DayEntry } from '@/services/timeclock-service'

function useCurrentTime() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(interval)
  }, [])

  return now
}

function getTodayEntry(entries: Array<Record<string, DayEntry>>) {
  const today = new Date().toLocaleDateString('pt-BR')
  const current = entries
    .flatMap((entry) => Object.values(entry))
    .find((entry) => new Date(entry.occurredAt).toLocaleDateString('pt-BR') === today)

  return current || null
}

export function HomePage() {
  const queryClient = useQueryClient()
  const now = useCurrentTime()
  const entriesQuery = useQuery({ queryKey: ['time-entries', 1, 100], queryFn: () => getEntries(1, 100) })
  const scheduleQuery = useQuery({ queryKey: ['work-schedule'], queryFn: getWorkSchedule })
  const [lastAction, setLastAction] = useState<string | null>(null)
  const todayEntry = useMemo(() => getTodayEntry(entriesQuery.data?.entries || []), [entriesQuery.data])

  const actionMutation = useMutation({
    mutationFn: async () => {
      if (!todayEntry || todayEntry.timeEntryStage === 'clocked-out') return { type: 'Entrada', response: await registerTimeIn() }
      if (todayEntry.timeEntryStage === 'on-break') return { type: 'Fim da pausa', response: await toggleBreak() }
      return { type: 'Saída', response: await registerTimeOut() }
    },
    onSuccess: ({ type }) => {
      const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      setLastAction(`${type} registrada às ${time}`)
      toast.success(`${type} registrada às ${time}`)
      void queryClient.invalidateQueries({ queryKey: ['time-entries'] })
      void queryClient.invalidateQueries({ queryKey: ['time-balance'] })
      void queryClient.invalidateQueries({ queryKey: ['balance-events'] })
      void queryClient.invalidateQueries({ queryKey: ['accumulated-delay'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const breakMutation = useMutation({
    mutationFn: toggleBreak,
    onSuccess: () => {
      const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      const label = todayEntry?.timeEntryStage === 'on-break' ? 'Fim da pausa' : 'Pausa iniciada'
      setLastAction(`${label} às ${time}`)
      toast.success(`${label} às ${time}`)
      void queryClient.invalidateQueries({ queryKey: ['time-entries'] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const isLoading = entriesQuery.isLoading || scheduleQuery.isLoading
  const status = todayEntry?.timeEntryStage || null

  return (
    <div className="space-y-8">
      <PageHeader title="Hoje" description={formatDate(now)} />

      {isLoading ? <LoadingState rows={3} /> : (
        <>
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Horário atual</p>
                  <p className="mt-1 text-5xl font-semibold tracking-[-0.06em] tabular-nums text-foreground sm:text-6xl">{now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                {lastAction && <p className="max-w-44 text-right text-xs text-emerald-700 dark:text-emerald-400">{lastAction}</p>}
              </div>
              <TimeClockAction status={status} isPending={actionMutation.isPending} onAction={() => actionMutation.mutate()} />
              {status === 'clocked-in' && (
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => breakMutation.mutate()} disabled={breakMutation.isPending}>
                  {breakMutation.isPending ? 'Registrando…' : 'Iniciar pausa'}
                </Button>
              )}
            </div>

            <Card className="border-border/70 bg-card shadow-none">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Jornada prevista</CardTitle></CardHeader>
              <CardContent>
                {scheduleQuery.isError ? <p className="text-sm text-muted-foreground">Jornada não configurada.</p> : scheduleQuery.data ? (
                  <>
                    <p className="text-2xl font-semibold tracking-tight">{scheduleQuery.data.startTime} <span className="text-muted-foreground">–</span> {scheduleQuery.data.endTime}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Tolerância de {scheduleQuery.data.lateTolerance} min · {scheduleQuery.data.breaksPerDay} pausas</p>
                  </>
                ) : <p className="text-sm text-muted-foreground">Nenhuma jornada encontrada.</p>}
              </CardContent>
            </Card>
          </section>
          <TodayRecords entry={todayEntry} />
        </>
      )}
      {!isLoading && entriesQuery.isError && <EmptyState title="Não foi possível carregar o dia" description="Verifique se a API está disponível e tente atualizar a página." />}
    </div>
  )
}
