import { ArrowRight, Coffee, LogIn, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TimeEntryStage } from '@/services/timeclock-service'

interface TimeClockActionProps {
  status: TimeEntryStage | null
  isPending: boolean
  onAction: () => void
}

export function TimeClockAction({ status, isPending, onAction }: TimeClockActionProps) {
  const action = status === 'clocked-in'
    ? { label: 'Registrar saída', hint: 'Encerrar jornada de hoje', icon: LogOut }
    : status === 'on-break'
      ? { label: 'Encerrar pausa', hint: 'Voltar para a jornada', icon: Coffee }
      : { label: 'Registrar entrada', hint: 'Começar jornada de hoje', icon: LogIn }

  const Icon = action.icon

  return (
    <div className="rounded-2xl border border-amber-300/70 bg-amber-50/80 p-5 dark:border-amber-800/70 dark:bg-amber-950/20 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-amber-950/70 dark:text-amber-200/70">Próximo registro</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-amber-950 dark:text-amber-100">{action.hint}</p>
        </div>
        <Button
          size="lg"
          className="h-14 w-full gap-3 rounded-xl bg-amber-700 px-6 text-base text-white shadow-none hover:bg-amber-800 sm:w-auto"
          onClick={onAction}
          disabled={isPending}
        >
          <Icon className="size-5" />
          {isPending ? 'Registrando…' : action.label}
          <ArrowRight className="size-4 opacity-70" />
        </Button>
      </div>
      {status === 'clocked-in' && (
        <p className="mt-4 text-xs text-amber-950/60 dark:text-amber-200/60">Precisa pausar? Use o botão de pausa ao lado do registro atual.</p>
      )}
    </div>
  )
}
