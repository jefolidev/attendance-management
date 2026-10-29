import { Badge } from '@/components/ui/badge'
import type { TimeEntryStage } from '@/services/timeclock-service'

const labels: Record<TimeEntryStage, string> = {
  'clocked-in': 'Em jornada',
  'clocked-out': 'Encerrado',
  'on-break': 'Em pausa',
}

export function StatusBadge({ status }: { status: TimeEntryStage }) {
  return (
    <Badge variant="outline" className={status === 'on-break' ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300' : status === 'clocked-in' ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300' : ''}>
      {labels[status]}
    </Badge>
  )
}
