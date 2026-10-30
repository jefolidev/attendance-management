import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { SortOrderButton } from '@/components/shared/sort-order-button'
import { useAuth } from '@/features/auth/use-auth'
import { formatDateKey, formatDateTime, formatDuration } from '@/lib/formatters'
import type { SortDirection } from '@/lib/sorting'
import { getAdminEmployeeEntries, getAdminEmployees } from '@/services/admin-service'

export function AdminRecordsPage() {
  const { impersonatedUser, setImpersonatedUser } = useAuth()
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortDirection>('desc')
  const [dateFilter, setDateFilter] = useState('')
  const employeesQuery = useQuery({ queryKey: ['admin-records-employees'], queryFn: () => getAdminEmployees(1, 100, 'desc') })
  const entriesQuery = useQuery({ queryKey: ['admin-records', impersonatedUser?.id, page, sort], queryFn: () => getAdminEmployeeEntries(impersonatedUser!.id, page, 10, sort), enabled: Boolean(impersonatedUser) })
  const rows = useMemo(() => (entriesQuery.data?.entries || []).flatMap((item) => {
    const [date, entry] = Object.entries(item)[0] || ['', null]
    return entry ? [{ date, entry }] : []
  }).filter(({ entry }) => !dateFilter || entry.occurredAt.slice(0, 10) === dateFilter), [dateFilter, entriesQuery.data])

  return (
    <div className="space-y-8">
      <PageHeader title="Registros" description="Consulte o histórico consolidado de um perfil por vez." />

      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2"><label htmlFor="admin-record-user" className="text-sm font-medium">Usuário</label><select id="admin-record-user" className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" value={impersonatedUser?.id || ''} onChange={(event) => { const user = employeesQuery.data?.employees.find((employee) => employee.id === event.target.value); if (user) { setImpersonatedUser(user); setPage(1) } }}><option value="">Selecione um perfil</option>{employeesQuery.data?.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.username}</option>)}</select></div>
        <div className="flex-1 space-y-2"><label htmlFor="admin-record-date" className="flex items-center gap-2 text-sm font-medium"><Filter className="size-4 text-muted-foreground" /> Data</label><input id="admin-record-date" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" /></div>
        <SortOrderButton value={sort} onChange={(value) => { setSort(value); setPage(1) }} />
      </div>

      {!impersonatedUser && <EmptyState title="Selecione um perfil" description="Os registros administrativos são consultados pelo usuário selecionado." action={<Button asChild><Link to="/admin/select-profile">Escolher perfil</Link></Button>} />}
      {impersonatedUser && entriesQuery.isLoading && <LoadingState rows={6} />}
      {impersonatedUser && entriesQuery.isError && <EmptyState title="Registros indisponíveis" description="Não foi possível carregar os registros deste perfil." action={<Button variant="outline" onClick={() => void entriesQuery.refetch()}>Tentar novamente</Button>} />}
      {impersonatedUser && !entriesQuery.isLoading && !entriesQuery.isError && rows.length === 0 && <EmptyState title="Nenhum registro encontrado" description={dateFilter ? 'Não há registros nessa data nesta página.' : 'Este perfil ainda não possui registros consolidados.'} />}
      {impersonatedUser && rows.length > 0 && <Card className="border-border/70 shadow-none"><CardContent className="p-0"><div className="divide-y">{rows.map(({ date, entry }) => <div key={date} className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><p className="font-medium capitalize">{formatDateKey(date)}</p><p className="mt-1 text-sm text-muted-foreground">Entrada às {formatDateTime(entry.occurredAt)}{entry.clockOut ? ` · saída às ${formatDateTime(entry.clockOut)}` : ' · jornada aberta'}</p></div><p className="text-sm font-medium tabular-nums">{entry.totalWorkedMinutes < 0 ? 'Em andamento' : formatDuration(entry.totalWorkedMinutes)}</p></div>)}</div></CardContent></Card>}
      {entriesQuery.data && <div className="flex items-center justify-between border-t pt-5"><p className="text-sm text-muted-foreground">Página {entriesQuery.data.pagination.page}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft className="size-4" /> Anterior</Button><Button variant="outline" size="sm" disabled={!entriesQuery.data.pagination.hasNextPage} onClick={() => setPage((current) => current + 1)}>Próxima <ChevronRight className="size-4" /></Button></div></div>}
    </div>
  )
}
