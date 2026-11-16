import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { PageHeader } from '@/components/shared/page-header';
import { SortOrderButton } from '@/components/shared/sort-order-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDateTime, formatDuration } from '@/lib/formatters';
import type { SortDirection } from '@/lib/sorting';
import { getBalance, getBalanceEvents } from '@/services/hours-service';
import type { BalanceEventClockType } from '@/services/hours-service';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, WalletCards } from 'lucide-react';
import { useMemo, useState } from 'react';

const reasonLabels = {
  LATE_ARRIVAL: 'Atraso na entrada',
  EARLY_DEPARTURE: 'Saída antecipada',
  OVERTIME: 'Hora extra',
  COMPENSATION: 'Compensação',
  EXTRA: 'Tempo extra',
  MANUAL_ADJUSTMENT: 'Ajuste manual',
}

const clockTypeLabels: Record<BalanceEventClockType, string> = {
  CLOCK_IN: 'Entrada',
  CLOCK_OUT: 'Saída',
  OTHER: 'Ajuste',
}

export function HoursPage() {
  const [eventsPage, setEventsPage] = useState(1)
  const [eventsSort, setEventsSort] = useState<SortDirection>('desc')
  const [eventTypeFilter, setEventTypeFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL')
  const balanceQuery = useQuery({ queryKey: ['time-balance'], queryFn: getBalance })
  const eventsQuery = useQuery({ queryKey: ['balance-events', eventsPage, 20, eventsSort], queryFn: () => getBalanceEvents(eventsPage, 20, eventsSort) })
  const balance = balanceQuery.data?.balance
  const balanceMinutes = balance?.balanceMinutes ?? 0
  const hasDebt = balanceMinutes < 0
  const events = useMemo(() => (eventsQuery.data?.events ?? []).filter((event) => eventTypeFilter === 'ALL' || event.type === eventTypeFilter), [eventTypeFilter, eventsQuery.data])

  return (
    <div className="space-y-8">
      <PageHeader title="Banco de horas" description="Acompanhe o saldo e as movimentações recebidas da API." />

      {balanceQuery.isLoading ? <LoadingState rows={2} /> : balanceQuery.isError ? <EmptyState title="Saldo indisponível" description="Ainda não há um banco de horas disponível para este funcionário." /> : (
        <section className="grid gap-4">
          <Card className={hasDebt ? 'border-red-200 bg-red-50 text-red-700 shadow-none dark:border-red-900/60 dark:bg-red-950 dark:text-red-300' : 'border-border/70 bg-primary text-primary-foreground shadow-none'}>
            <CardContent className="flex min-h-44 flex-col justify-between p-6">
              <div className={hasDebt ? 'flex items-center gap-2 text-sm text-red-700/70 dark:text-red-300/70' : 'flex items-center gap-2 text-sm text-primary-foreground/70'}><WalletCards className="size-4" /> Saldo atual</div>
              <div><p className="text-5xl font-semibold tracking-[-0.06em] tabular-nums">{balance ? formatDuration(Math.abs(balanceMinutes)) : '0min'}</p><p className="mt-1 text-sm font-medium">{hasDebt ? 'Em atraso' : 'Saldo positivo'}</p></div>
              <p className={hasDebt ? 'text-sm text-red-700/70 dark:text-red-300/70' : 'text-sm text-primary-foreground/70'}>{balance?.updatedAt ? `Atualizado em ${formatDateTime(balance.updatedAt)}` : 'Ainda sem atualização registrada'}</p>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-semibold tracking-tight">Movimentações recentes</h2><p className="text-sm text-muted-foreground">Cada item registra separadamente uma entrada, uma saída ou um ajuste no banco de horas.</p></div><SortOrderButton value={eventsSort} onChange={(value) => { setEventsSort(value); setEventsPage(1) }} /></div>
        <div className="flex flex-wrap gap-2" aria-label="Filtrar movimentações por tipo">
          <Button size="sm" variant={eventTypeFilter === 'ALL' ? 'default' : 'outline'} onClick={() => setEventTypeFilter('ALL')}>Todas</Button>
          <Button size="sm" variant={eventTypeFilter === 'CREDIT' ? 'default' : 'outline'} onClick={() => setEventTypeFilter('CREDIT')}>Créditos</Button>
          <Button size="sm" variant={eventTypeFilter === 'DEBIT' ? 'default' : 'outline'} onClick={() => setEventTypeFilter('DEBIT')}>Débitos</Button>
        </div>
        <p className="text-xs text-muted-foreground">Os horários exibidos são os horários efetivos registrados para cada movimentação.</p>
        {eventsQuery.isLoading && <LoadingState rows={4} />}
        {eventsQuery.isError && <EmptyState title="Movimentações indisponíveis" description="Não foi possível carregar o histórico do banco de horas." />}
        {!eventsQuery.isLoading && !eventsQuery.isError && events.length === 0 && <EmptyState title={eventTypeFilter === 'ALL' ? 'Nenhuma movimentação' : 'Nenhuma movimentação neste filtro'} description={eventTypeFilter === 'ALL' ? 'Os lançamentos aparecerão aqui quando houver créditos ou débitos.' : 'Não há lançamentos deste tipo nesta página.'} />}
        {!eventsQuery.isLoading && !eventsQuery.isError && events.length > 0 && (
          <Card className="border-border/70 shadow-none">
            <CardContent className="p-0">
              <div className="divide-y">
                {events.map((event, index) => {
                  const isCredit = event.type === 'CREDIT'
                  return <div key={`${event.timeEntryId ?? 'manual'}-${event.createdAt}-${event.reason}-${index}`} className="flex items-center gap-4 p-4 sm:p-5">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-full ${isCredit ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'}`}>
                      {isCredit ? <ArrowUpRight className="size-4" /> : <ArrowDownLeft className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{reasonLabels[event.reason]}</p><p className="text-xs text-muted-foreground">{clockTypeLabels[event.clockType]} às {formatDateTime(event.createdAt)}</p></div>
                    <Badge variant="outline" className={isCredit ? 'border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400' : 'border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400'}>{isCredit ? '+' : '-'}{formatDuration(event.durationInMinutes)}</Badge>
                  </div>
                })}
              </div>
            </CardContent>
          </Card>
        )}
        {eventsQuery.data && (
          <div className="flex items-center justify-between border-t pt-5">
            <p className="text-sm text-muted-foreground">Página {eventsQuery.data.pagination.page}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={eventsPage === 1} onClick={() => setEventsPage((current) => Math.max(1, current - 1))}><ChevronLeft className="size-4" /> Anterior</Button>
              <Button variant="outline" size="sm" disabled={!eventsQuery.data.pagination.hasNextPage} onClick={() => setEventsPage((current) => current + 1)}>Próxima <ChevronRight className="size-4" /></Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
