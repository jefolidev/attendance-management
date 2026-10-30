import { Coffee, LogIn, Pause, Timer } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDateTime, formatDuration } from '@/lib/formatters'
import type { DayEntry } from '@/services/timeclock-service'

export function TodayRecords({ entry }: { entry: DayEntry | null }) {
  if (!entry) {
    return <EmptyState title="Nenhum registro hoje" description="Seu primeiro registro do dia aparecerá aqui assim que você bater o ponto." />
  }

  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">Registros de hoje</CardTitle>
        <StatusBadge status={entry.timeEntryStage} />
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><LogIn className="size-4" /></span>
          <div className="min-w-0">
            <p className="text-sm font-medium">Entrada</p>
            <p className="text-sm text-muted-foreground">{formatDateTime(entry.occurredAt)}</p>
          </div>
          {entry.entryMinutesLate > 0 && <span className="ml-auto text-right text-xs text-amber-700 dark:text-amber-400">{formatDuration(entry.entryMinutesLate)} de atraso</span>}
          {entry.entryMinutesEarly > 0 && <span className="ml-auto text-right text-xs text-emerald-700 dark:text-emerald-400">{formatDuration(entry.entryMinutesEarly)} adiantado</span>}
        </div>

        {entry.breaks.map((breakEntry, index) => (
          <div key={`${breakEntry.start}-${index}`} className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><Coffee className="size-4" /></span>
            <div className="min-w-0">
              <p className="text-sm font-medium">Pausa {index + 1}</p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(breakEntry.start)}{breakEntry.end ? ` · retorno ${formatDateTime(breakEntry.end)}` : ' · em andamento'}
              </p>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3 border-t pt-4 text-sm text-muted-foreground">
          <Timer className="size-4" />
          <span>{entry.totalWorkedMinutes < 0 ? 'Jornada em andamento' : `${formatDuration(entry.totalWorkedMinutes)} trabalhados`}</span>
          {entry.departureMinutesEarly > 0 && <span className="ml-auto text-xs text-amber-700 dark:text-amber-400">saída antecipada</span>}
          {entry.departureMinutesLate > 0 && <span className="ml-auto text-xs text-emerald-700 dark:text-emerald-400">hora extra</span>}
          <Pause className="hidden size-4" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  )
}
