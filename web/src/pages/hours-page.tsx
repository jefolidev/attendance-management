import { useQuery } from '@tanstack/react-query'
import { ArrowDownLeft, ArrowUpRight, WalletCards } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { formatDateTime, formatMinutes, formatMinutesCompact } from '@/lib/formatters'
import { getBalance, getBalanceEvents } from '@/services/hours-service'

const reasonLabels = {
  LATE_ARRIVAL: 'Atraso na entrada',
  EARLY_DEPARTURE: 'Saída antecipada',
  OVERTIME: 'Hora extra',
  COMPENSATION: 'Compensação',
  EXTRA: 'Tempo extra',
  MANUAL_ADJUSTMENT: 'Ajuste manual',
}

export function HoursPage() {
  const balanceQuery = useQuery({ queryKey: ['time-balance'], queryFn: getBalance })
  const eventsQuery = useQuery({ queryKey: ['balance-events', 1, 20], queryFn: () => getBalanceEvents(1, 20) })
  const balance = balanceQuery.data?.balance

  return (
    <div className="space-y-8">
      <PageHeader title="Banco de horas" description="Acompanhe o saldo e as movimentações recebidas da API." />

      {balanceQuery.isLoading ? <LoadingState rows={2} /> : balanceQuery.isError ? <EmptyState title="Saldo indisponível" description="Ainda não há um banco de horas disponível para este funcionário." /> : (
        <section className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_15rem]">
          <Card className="border-border/70 bg-primary text-primary-foreground shadow-none">
            <CardContent className="flex min-h-44 flex-col justify-between p-6">
              <div className="flex items-center gap-2 text-sm text-primary-foreground/70"><WalletCards className="size-4" /> Saldo atual</div>
              <p className="text-5xl font-semibold tracking-[-0.06em] tabular-nums">{balance ? formatMinutesCompact(balance.balanceMinutes) : '00:00'}</p>
              <p className="text-sm text-primary-foreground/70">{balance?.updatedAt ? `Atualizado em ${formatDateTime(balance.updatedAt)}` : 'Ainda sem atualização registrada'}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-none">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Leitura do saldo</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{balance ? formatMinutes(balance.balanceMinutes) : 'Sem saldo'}</p>
              <p className="mt-2 text-sm text-muted-foreground">Valor consolidado pela API, sem cálculo no frontend.</p>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="space-y-4">
        <div><h2 className="text-lg font-semibold tracking-tight">Movimentações recentes</h2><p className="text-sm text-muted-foreground">Créditos e débitos lançados no banco de horas.</p></div>
        {eventsQuery.isLoading && <LoadingState rows={4} />}
        {eventsQuery.isError && <EmptyState title="Movimentações indisponíveis" description="Não foi possível carregar o histórico do banco de horas." />}
        {!eventsQuery.isLoading && !eventsQuery.isError && eventsQuery.data?.events.length === 0 && <EmptyState title="Nenhuma movimentação" description="Os lançamentos aparecerão aqui quando houver créditos ou débitos." />}
        {!eventsQuery.isLoading && !eventsQuery.isError && eventsQuery.data && eventsQuery.data.events.length > 0 && (
          <Card className="border-border/70 shadow-none">
            <CardContent className="p-0">
              <div className="divide-y">
                {eventsQuery.data.events.map((event) => {
                  const isCredit = event.type === 'CREDIT'
                  return <div key={`${event.createdAt}-${event.reason}`} className="flex items-center gap-4 p-4 sm:p-5">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-full ${isCredit ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'}`}>
                      {isCredit ? <ArrowUpRight className="size-4" /> : <ArrowDownLeft className="size-4" />}
                    </span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{reasonLabels[event.reason]}</p><p className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p></div>
                    <Badge variant="outline" className={isCredit ? 'border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400' : 'border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400'}>{isCredit ? '+' : '-'}{formatMinutes(event.durationInMinutes)}</Badge>
                  </div>
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
