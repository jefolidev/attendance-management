import { ArrowRight, CalendarClock, CheckCircle2, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { TimeClockAction } from '@/features/timeclock/components/time-clock-action'
import { useTimeClockStatus } from '@/features/timeclock/hooks/use-time-clock-status'
import { useAuth } from '@/features/auth/use-auth'
import { formatDate, formatDuration, formatTime } from '@/lib/formatters'
import { getWorkSchedule } from '@/services/work-schedule-service'

export function HomePage() {
  const { employee } = useAuth()
  const clock = useTimeClockStatus()
  const scheduleQuery = useQuery({ queryKey: ['work-schedule'], queryFn: getWorkSchedule, retry: false })
  const firstName = employee?.username || 'você'
  const now = useCurrentTime()

  if (clock.isLoading || scheduleQuery.isLoading) {
    return <div className="mx-auto max-w-5xl space-y-8"><LoadingState rows={3} /></div>
  }

  if (clock.isError || scheduleQuery.isError) {
    return <EmptyState title="Não foi possível carregar o seu dia" description="Verifique se a API está disponível e tente novamente." action={<Button onClick={() => void Promise.all([clock.refetch(), scheduleQuery.refetch()])}>Tentar novamente</Button>} />
  }

  return (
    <div className="state-enter mx-auto max-w-5xl">
      {clock.status === 'not-started' && (
        <section className="flex min-h-[calc(100svh-11rem)] flex-col items-center justify-center text-center">
          <span className="mb-7 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Clock3 className="size-6" /></span>
          <p className="mb-3 text-sm font-medium text-muted-foreground">{formatDate(now)}</p>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">Bem-vindo(a), {firstName}!<br />Vamos dar início ao trabalho?</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Quando estiver pronto, registre sua entrada para começar a jornada de hoje.</p>
          <div className="mt-10 w-full">
            {scheduleQuery.data ? <TimeClockAction {...clockActionProps(clock)} /> : <ScheduleMissingNotice />}
          </div>
          <ActionFeedback action={clock.lastAction} />
        </section>
      )}

      {(clock.status === 'working' || clock.status === 'on-break') && (
        <section className="mx-auto flex min-h-[calc(100svh-11rem)] max-w-3xl flex-col justify-center">
          <p className="mb-3 text-sm font-medium text-muted-foreground">{formatDate(now)}</p>
          <h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">{clock.status === 'on-break' ? 'Faça uma boa pausa.' : `Bom trabalho, ${firstName}.`}</h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">{clock.status === 'on-break' ? 'Seu registro está pausado. Retome quando voltar.' : 'Sua jornada está em andamento. Registre o próximo momento quando ele acontecer.'}</p>
          <div className="mt-10"><TimeClockAction {...clockActionProps(clock)} /></div>
          <ActionFeedback action={clock.lastAction} />
        </section>
      )}

      {clock.status === 'completed' && clock.todayEntry && (
        <section className="mx-auto flex min-h-[calc(100svh-11rem)] max-w-4xl flex-col justify-center">
          <div className="mb-8 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="size-4" /> Registro encerrado</div>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">Jornada concluída!<br />Bom descanso, {firstName}.</h1>
          <p className="mt-4 text-sm text-muted-foreground">{formatDate(now)}</p>

          <Card className="mt-10 rounded-2xl border-border shadow-sm">
            <CardContent className="p-5 sm:p-7">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryItem label="Entrada" value={formatTime(clock.todayEntry.occurredAt)} />
                {clock.todayEntry.clockOut ? (
                  <SummaryItem label="Saída" value={formatTime(clock.todayEntry.clockOut)} />
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground">Saída</p>
                    <EmptyState
                      title="Sem registros de saída"
                      description="A API ainda não retornou esse horário."
                      className="mt-2 min-h-0 items-start border-0 bg-transparent p-0 text-left"
                    />
                  </div>
                )}
                <SummaryItem label="Tempo total" value={clock.todayEntry.totalWorkedMinutes < 0 ? 'Em andamento' : formatDuration(clock.todayEntry.totalWorkedMinutes)} />
                {clock.todayEntry.totalBreakMinutes > 0 && <SummaryItem label="Tempo de pausa" value={formatDuration(clock.todayEntry.totalBreakMinutes)} />}
              </div>
            </CardContent>
          </Card>

          <div className="mt-7"><Button asChild variant="outline" size="lg" className="gap-2 rounded-lg active:scale-[0.98]"><Link to="/historico">Ver meu histórico completo <ArrowRight className="size-4" /></Link></Button></div>
        </section>
      )}
    </div>
  )
}

function ScheduleMissingNotice() {
  return (
    <Card className="mx-auto w-full max-w-xl border-amber-200 bg-amber-50/70 text-left shadow-none dark:border-amber-900/70 dark:bg-amber-950/20">
      <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" aria-hidden="true">
          <CalendarClock className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-medium text-amber-950 dark:text-amber-100">Horário de trabalho não encontrado</h2>
          <p className="mt-1 text-sm leading-6 text-amber-900/75 dark:text-amber-200/75">Talvez seu horário de trabalho ainda não esteja cadastrado. Configure-o antes de registrar a entrada.</p>
        </div>
        <Button asChild variant="outline" className="shrink-0 border-amber-300 bg-transparent text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/60">
          <Link to="/configuracoes">Ir para configurações</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function useCurrentTime() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(interval)
  }, [])

  return now
}

function clockActionProps(clock: ReturnType<typeof useTimeClockStatus>) {
  return {
    status: clock.status,
    todayEntry: clock.todayEntry,
    isClockingIn: clock.isClockingIn,
    isTogglingBreak: clock.isTogglingBreak,
    isClockingOut: clock.isClockingOut,
    onClockIn: clock.clockIn,
    onToggleBreak: clock.toggleBreak,
    onClockOut: clock.clockOut,
  }
}

function SummaryItem({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold tracking-tight tabular-nums">{value}</p>{hint && <p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p>}</div>
}

function ActionFeedback({ action }: { action: { label: string; occurredAt: Date } | null }) {
  if (!action) return null

  return <p role="status" className="mt-8 text-sm text-emerald-700 dark:text-emerald-400">{action.label} às {action.occurredAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
}
