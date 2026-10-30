import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Clock3, TimerReset, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { useAuth } from '@/features/auth/use-auth'
import { formatDateTime, formatDuration } from '@/lib/formatters'
import { getAdminEmployeeDelays, getAdminEmployeeEntries, getAdminEmployees } from '@/services/admin-service'

export function AdminDashboardPage() {
  const { impersonatedUser } = useAuth()
  const employeesQuery = useQuery({ queryKey: ['admin-employees', 1, 20, 'desc'], queryFn: () => getAdminEmployees(1, 20, 'desc') })
  const entriesQuery = useQuery({ queryKey: ['admin-dashboard-entries', impersonatedUser?.id], queryFn: () => getAdminEmployeeEntries(impersonatedUser!.id, 1, 5, 'desc'), enabled: Boolean(impersonatedUser) })
  const delaysQuery = useQuery({ queryKey: ['admin-dashboard-delays', impersonatedUser?.id], queryFn: () => getAdminEmployeeDelays(impersonatedUser!.id, 1, 5, 'desc'), enabled: Boolean(impersonatedUser) })

  const recentEntries = (entriesQuery.data?.entries || []).flatMap((item) => {
    const [date, entry] = Object.entries(item)[0] || ['', null]
    return entry ? [{ date, entry }] : []
  })

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Uma leitura rápida dos perfis e do usuário atualmente selecionado." action={<Button variant="outline" asChild><Link to="/admin/select-profile">Selecionar perfil <ArrowRight className="size-4" /></Link></Button>} />

      <section className="grid gap-4 md:grid-cols-3">
        <AdminMetric label="Usuários visíveis" value={employeesQuery.data ? String(employeesQuery.data.employees.length) : '—'} icon={Users} />
        <AdminMetric label="Registros do perfil" value={impersonatedUser && entriesQuery.data ? String(entriesQuery.data.entries.length) : '—'} icon={Clock3} />
        <AdminMetric label="Atrasos do perfil" value={impersonatedUser && delaysQuery.data ? formatDuration(delaysQuery.data.totalLateMinutes) : '—'} icon={TimerReset} />
      </section>

      {!impersonatedUser && <EmptyState title="Nenhum perfil selecionado" description="Escolha um usuário para consultar seus registros e atrasos nesta área." action={<Button asChild><Link to="/admin/select-profile">Escolher perfil</Link></Button>} />}
      {impersonatedUser && (
        <Card className="border-border/70 shadow-none">
          <CardHeader className="flex-row items-end justify-between space-y-0"><div><CardTitle className="text-lg">Batidas recentes</CardTitle><p className="mt-1 text-sm text-muted-foreground">{impersonatedUser.username} · dados do endpoint de registros.</p></div><Button variant="ghost" size="sm" asChild><Link to={`/admin/users/${impersonatedUser.id}`}>Ver perfil</Link></Button></CardHeader>
          <CardContent>
            {entriesQuery.isLoading && <LoadingState rows={5} />}
            {entriesQuery.isError && <EmptyState title="Registros indisponíveis" description="Não foi possível carregar os registros deste perfil." />}
            {!entriesQuery.isLoading && !entriesQuery.isError && recentEntries.length === 0 && <EmptyState title="Nenhum registro recente" description="Este perfil ainda não possui registros consolidados." />}
            {!entriesQuery.isLoading && !entriesQuery.isError && recentEntries.length > 0 && <div className="divide-y">{recentEntries.map(({ date, entry }) => <div key={date} className="flex items-center justify-between gap-4 py-4"><div><p className="font-medium capitalize">{date}</p><p className="text-sm text-muted-foreground">Entrada às {formatDateTime(entry.occurredAt)}</p></div><p className="text-sm font-medium tabular-nums">{entry.clockOut ? `Saída às ${formatDateTime(entry.clockOut)}` : 'Jornada aberta'}</p></div>)}</div>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AdminMetric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Users }) {
  return <Card className="border-border/70 shadow-none"><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p></div><span className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground"><Icon className="size-5" /></span></CardContent></Card>
}
