import { Coffee, LogIn, LogOut, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatTime } from '@/lib/formatters'
import type { DayEntry } from '@/services/timeclock-service'
import type { TimeClockDayStatus } from '../hooks/use-time-clock-status'

interface TimeClockActionProps {
  status: TimeClockDayStatus
  todayEntry: DayEntry | null
  isClockingIn: boolean
  isTogglingBreak: boolean
  isClockingOut: boolean
  onClockIn: () => void
  onToggleBreak: () => void
  onClockOut: () => void
}

export function TimeClockAction({
  status,
  todayEntry,
  isClockingIn,
  isTogglingBreak,
  isClockingOut,
  onClockIn,
  onToggleBreak,
  onClockOut,
}: TimeClockActionProps) {
  if (status === 'not-started') {
    return (
      <div className="flex justify-center pt-4">
        <Button size="lg" className="h-16 w-full max-w-sm gap-3 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-sm active:scale-[0.98] sm:w-auto" onClick={onClockIn} disabled={isClockingIn}>
          <LogIn className="size-5" />
          {isClockingIn ? 'Registrando…' : 'Bater Ponto de Entrada'}
        </Button>
      </div>
    )
  }

  if (status === 'completed') return null

  const isOnBreak = status === 'on-break'

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`relative grid size-3 place-items-center rounded-full ${isOnBreak ? 'bg-amber-400' : 'bg-emerald-500'}`}>
            {!isOnBreak && <span className="absolute size-3 animate-ping rounded-full bg-emerald-400/60" aria-hidden="true" />}
          </span>
          <div>
            <p className="font-medium">{isOnBreak ? 'Em pausa' : 'Trabalhando'}</p>
            <p className="text-sm text-muted-foreground">Entrada às {todayEntry ? formatTime(todayEntry.occurredAt) : '—'}</p>
          </div>
        </div>
        <Badge variant="outline" className={isOnBreak ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300' : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'}>
          {isOnBreak ? 'Pausa' : 'Ativo'}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="outline" size="lg" className="h-12 gap-2 rounded-lg active:scale-[0.98]" onClick={onToggleBreak} disabled={isTogglingBreak}>
          {isOnBreak ? <Play className="size-4" /> : <Coffee className="size-4" />}
          {isTogglingBreak ? 'Registrando…' : isOnBreak ? 'Retomar Trabalho' : 'Adicionar Pausa'}
        </Button>
        <Button variant="destructive" size="lg" className="h-12 gap-2 rounded-lg active:scale-[0.98]" onClick={onClockOut} disabled={isClockingOut || isOnBreak}>
          <LogOut className="size-4" />
          {isClockingOut ? 'Registrando…' : 'Bater Ponto de Saída'}
        </Button>
      </div>
      {isOnBreak && <p className="text-xs text-muted-foreground">Retome o trabalho antes de encerrar a jornada.</p>}
    </div>
  )
}
