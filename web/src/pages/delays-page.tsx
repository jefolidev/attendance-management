import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, TimerReset } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { formatMinutes } from '@/lib/formatters'
import { getAccumulatedDelay } from '@/services/hours-service'

export function DelaysPage() {
  const query = useQuery({ queryKey: ['accumulated-delay'], queryFn: getAccumulatedDelay })
  const delay = query.data

  return (
    <div className="space-y-8">
      <PageHeader title="Atrasos" description="Veja o resumo de atrasos calculado pelo backend." />
      {query.isLoading && <LoadingState rows={3} />}
      {query.isError && <EmptyState title="Resumo indisponível" description="Não foi possível carregar os atrasos acumulados." />}
      {!query.isLoading && !query.isError && delay && (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard icon={TimerReset} label="Total de atrasos" value={formatMinutes(delay.totalLateMinutes)} tone="amber" />
          <MetricCard icon={CheckCircle2} label="Compensado" value={formatMinutes(delay.compensatedMinutes)} tone="green" />
          <MetricCard icon={AlertTriangle} label="Não compensado" value={formatMinutes(delay.uncompensatedMinutes)} tone="red" />
        </div>
      )}
      {!query.isLoading && !query.isError && !delay && <EmptyState title="Nenhum atraso registrado" description="Quando a API retornar um resumo, ele aparecerá aqui." />}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, tone }: { icon: typeof TimerReset; label: string; value: string; tone: 'amber' | 'green' | 'red' }) {
  const styles = {
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
  }

  return <Card className="border-border/70 shadow-none"><CardContent className="p-5"><span className={`grid size-9 place-items-center rounded-full ${styles[tone]}`}><Icon className="size-4" /></span><p className="mt-5 text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p></CardContent></Card>
}
