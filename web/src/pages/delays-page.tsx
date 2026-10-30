import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ChevronLeft, ChevronRight, Clock3, TimerReset } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { SortOrderButton } from '@/components/shared/sort-order-button'
import { formatDuration, formatShortDate, formatTime } from '@/lib/formatters'
import type { SortDirection } from '@/lib/sorting'
import { getAccumulatedDelay } from '@/services/hours-service'

export function DelaysPage() {
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortDirection>('desc')
  const delayQuery = useQuery({
    queryKey: ['accumulated-delay', page, sort],
    queryFn: () => getAccumulatedDelay(page, 10, sort),
  })
  const delay = delayQuery.data

  return (
    <div className="space-y-8">
      <PageHeader title="Atrasos" description="Acompanhe o que foi compensado e os dias que pedem atenção." />

      {delayQuery.isLoading && <LoadingState rows={4} />}
      {delayQuery.isError && <EmptyState title="Atrasos indisponíveis" description="Não foi possível carregar os atrasos acumulados." action={<Button onClick={() => void delayQuery.refetch()}>Tentar novamente</Button>} />}
      {!delayQuery.isLoading && !delayQuery.isError && delay && (
        <>
          <section className="grid gap-4 md:grid-cols-[1.35fr_1fr_1fr]">
            <MetricCard label="Total Compensado" value={formatDuration(delay.compensatedMinutes)} icon={TimerReset} featured />
            <MetricCard label="Horas Atrasadas" value={formatDuration(delay.totalLateMinutes)} icon={AlertTriangle} />
            <MetricCard label="Horas/Minutos Não Compensados" value={formatDuration(delay.uncompensatedMinutes)} icon={Clock3} />
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-semibold tracking-tight">Dias com atraso</h2><p className="text-sm text-muted-foreground">Registros calculados a partir do seu horário de trabalho.</p></div><SortOrderButton value={sort} onChange={(value) => { setSort(value); setPage(1) }} /></div>
            {delay.days.length === 0 ? <EmptyState title="Nenhum atraso registrado" description="Os dias com chegada após o horário esperado aparecerão aqui." /> : (
              <div className="space-y-3">
                {delay.days.map((day) => (
                  <Card key={`${day.date}-${day.clockIn}`} className="border-border/70 shadow-none">
                    <CardContent className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="font-medium">{formatShortDate(day.date)}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="font-normal">Chegou às {formatTime(day.clockIn)}</Badge>
                          <span className="text-sm text-muted-foreground">Esperado: {day.expectedTime}</span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">Motivo: {day.reason === 'LATE_ARRIVAL' ? 'Atraso na entrada' : day.reason}</p>
                        {day.compensations.length > 0 && <div className="mt-2 space-y-1 text-sm text-emerald-700 dark:text-emerald-400">{day.compensations.map((compensation) => <p key={compensation.reason}>Compensado: +{formatDuration(compensation.durationInMinutes)}</p>)}</div>}
                      </div>
                      <p className="text-left text-sm font-medium text-amber-700 dark:text-amber-400 sm:text-right">{formatDuration(day.lateMinutes)} de atraso</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {delay.pagination && (
            <div className="flex items-center justify-between border-t pt-5">
              <p className="text-sm text-muted-foreground">Página {delay.pagination.page} de {delay.pagination.totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft className="size-4" /> Anterior</Button>
                <Button variant="outline" size="sm" disabled={!delay.pagination.hasNextPage} onClick={() => setPage((current) => current + 1)}>Próxima <ChevronRight className="size-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MetricCard({ label, value, icon: Icon, featured = false }: { label: string; value: string; icon: typeof TimerReset; featured?: boolean }) {
  return (
    <Card className={featured ? 'border-primary/30 bg-primary text-primary-foreground shadow-none' : 'border-border/70 shadow-none'}>
      <CardContent className={featured ? 'flex min-h-44 flex-col justify-between p-6' : 'flex min-h-36 flex-col justify-between p-5'}>
        <Icon className={featured ? 'size-5 text-primary-foreground/70' : 'size-4 text-muted-foreground'} />
        <div><p className={featured ? 'text-sm text-primary-foreground/70' : 'text-sm text-muted-foreground'}>{label}</p><p className={featured ? 'mt-2 text-4xl font-semibold tracking-[-0.06em] tabular-nums' : 'mt-2 text-xl font-semibold tabular-nums'}>{value}</p></div>
      </CardContent>
    </Card>
  )
}
