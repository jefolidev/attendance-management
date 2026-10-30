import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDateKey, formatDateTime, formatDuration } from '@/lib/formatters'
import { getEntries, type DayEntry } from '@/services/timeclock-service'

interface HistoryRow {
  date: string
  entry: DayEntry
}

export function HistoryPage() {
  const [page, setPage] = useState(1)
  const [dateFilter, setDateFilter] = useState('')
  const entriesQuery = useQuery({ queryKey: ['time-entries', page, 20], queryFn: () => getEntries(page, 20) })

  const rows = useMemo<HistoryRow[]>(() => (entriesQuery.data?.entries || []).map((item) => {
    const [date, entry] = Object.entries(item)[0] || ['', null]
    return { date, entry: entry as DayEntry }
  }).filter((row) => {
    if (!dateFilter) return true
    return row.entry.occurredAt.slice(0, 10) === dateFilter
  }), [dateFilter, entriesQuery.data])

  return (
    <div className="space-y-8">
      <PageHeader title="Histórico" description="Consulte os registros que a API já consolidou para você." />

      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <label htmlFor="history-date" className="flex items-center gap-2 text-sm font-medium"><Filter className="size-4 text-muted-foreground" /> Filtrar registros carregados por data</label>
          <Input id="history-date" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="max-w-xs" />
        </div>
        {dateFilter && <Button variant="ghost" onClick={() => setDateFilter('')}>Limpar filtro</Button>}
        <p className="text-xs text-muted-foreground sm:max-w-xs">A API atual oferece paginação, mas ainda não recebe filtro de data.</p>
      </div>

      {entriesQuery.isLoading && <LoadingState rows={5} />}
      {entriesQuery.isError && <EmptyState title="Não foi possível carregar o histórico" description="Verifique a conexão com a API e tente novamente." action={<Button onClick={() => void entriesQuery.refetch()}>Tentar novamente</Button>} />}
      {!entriesQuery.isLoading && !entriesQuery.isError && rows.length === 0 && <EmptyState title="Nenhum registro encontrado" description={dateFilter ? 'Não há registro nessa data entre os resultados carregados.' : 'Assim que você registrar um ponto, ele aparecerá aqui.'} />}

      {!entriesQuery.isLoading && !entriesQuery.isError && rows.length > 0 && (
        <Card className="border-border/70 shadow-none">
          <CardContent className="p-0">
            <div className="divide-y">
              {rows.map(({ date, entry }) => (
                <div key={date} className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-medium capitalize">{formatDateKey(date)}</p>
                      <StatusBadge status={entry.timeEntryStage} />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">Entrada registrada às {formatDateTime(entry.occurredAt)}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {entry.breaks.length > 0 && <span>{entry.breaks.length} {entry.breaks.length === 1 ? 'pausa' : 'pausas'}</span>}
                      {entry.entryMinutesLate > 0 && <span className="text-amber-700 dark:text-amber-400">{formatDuration(entry.entryMinutesLate)} de atraso</span>}
                      {entry.departureMinutesEarly > 0 && <span className="text-amber-700 dark:text-amber-400">saída antecipada</span>}
                      {entry.departureMinutesLate > 0 && <span className="text-emerald-700 dark:text-emerald-400">hora extra</span>}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-muted-foreground">Tempo trabalhado</p>
                    <p className="mt-1 font-medium tabular-nums">{entry.totalWorkedMinutes < 0 ? 'Em andamento' : formatDuration(entry.totalWorkedMinutes)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {entriesQuery.data && (entriesQuery.data.pagination.hasNextPage || page > 1) && (
        <div className="flex items-center justify-between border-t pt-5">
          <p className="text-sm text-muted-foreground">Página {page}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft className="size-4" /> Anterior</Button>
            <Button variant="outline" size="sm" disabled={!entriesQuery.data.pagination.hasNextPage} onClick={() => setPage((current) => current + 1)}>Próxima <ChevronRight className="size-4" /></Button>
          </div>
        </div>
      )}
    </div>
  )
}
