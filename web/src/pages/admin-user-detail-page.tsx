import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Clock3, KeyRound, TimerReset } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { z } from 'zod'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { WorkScheduleForm } from '@/components/shared/work-schedule-form'
import { useAuth } from '@/features/auth/use-auth'
import { formatDateKey, formatDateTime, formatDuration, getErrorMessage } from '@/lib/formatters'
import type { WorkScheduleFormValues } from '@/lib/work-schedule-schema'
import { getAdminEmployeeBalance, getAdminEmployeeDelays, getAdminEmployeeEntries, getAdminEmployeeWorkSchedule, getAdminEmployees, updateAdminEmployeeWorkSchedule, updateEmployeePassword } from '@/services/admin-service'
import { toast } from 'sonner'

const passwordSchema = z.object({ password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.') })
type PasswordForm = z.infer<typeof passwordSchema>

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { impersonatedUser } = useAuth()
  const queryClient = useQueryClient()
  const employeesQuery = useQuery({ queryKey: ['admin-employees', 1, 100, 'desc'], queryFn: () => getAdminEmployees(1, 100, 'desc') })
  const user = employeesQuery.data?.employees.find((employee) => employee.id === id)
  const entriesQuery = useQuery({ queryKey: ['admin-user-entries', id], queryFn: () => getAdminEmployeeEntries(id!, 1, 5, 'desc'), enabled: Boolean(id) })
  const balanceQuery = useQuery({ queryKey: ['admin-user-balance', id], queryFn: () => getAdminEmployeeBalance(id!), enabled: Boolean(id) })
  const delaysQuery = useQuery({ queryKey: ['admin-user-delays', id], queryFn: () => getAdminEmployeeDelays(id!, 1, 5, 'desc'), enabled: Boolean(id) })
  const scheduleQuery = useQuery({ queryKey: ['admin-user-schedule', id], queryFn: () => getAdminEmployeeWorkSchedule(id!), enabled: Boolean(id) })
  const passwordMutation = useMutation({ mutationFn: (values: PasswordForm) => updateEmployeePassword(id!, values.password), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin-employees'] }); reset(); toast.success('Senha atualizada.') }, onError: (error) => toast.error(getErrorMessage(error)) })
  const scheduleMutation = useMutation({ mutationFn: (values: WorkScheduleFormValues) => updateAdminEmployeeWorkSchedule(id!, values), onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['admin-user-schedule', id] }), queryClient.invalidateQueries({ queryKey: ['admin-user-entries', id] }), queryClient.invalidateQueries({ queryKey: ['admin-user-delays', id] })]); toast.success('Horário de trabalho atualizado.') }, onError: (error) => toast.error(getErrorMessage(error)) })
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  if (employeesQuery.isLoading) return <LoadingState rows={5} />
  if (!user) return <EmptyState title="Usuário não encontrado" description="O perfil solicitado não está disponível na API." action={<Button asChild><Link to="/admin/users">Voltar para usuários</Link></Button>} />

  const recentEntries = (entriesQuery.data?.entries || []).flatMap((item) => { const [date, entry] = Object.entries(item)[0] || ['', null]; return entry ? [{ date, entry }] : [] })

  return (
    <div className="space-y-8">
      <PageHeader title={user.username} description="Visão individual de registros, banco de horas e atrasos." action={<Button variant="outline" asChild><Link to="/admin/users"><ArrowLeft className="size-4" /> Usuários</Link></Button>} />
      <div className="flex items-center gap-4"><Avatar size="lg"><AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><div><p className="font-medium">{user.username}</p><Badge variant="outline">{user.role === 'ADMIN' ? 'Administrador' : 'Colaborador'}</Badge></div></div>

      <section className="grid gap-4 md:grid-cols-3"><Card className="border-border/70 shadow-none"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Saldo atual</p><p className="mt-2 text-3xl font-semibold tabular-nums">{balanceQuery.data?.balance ? formatDuration(Math.abs(balanceQuery.data.balance.balanceMinutes)) : '—'}</p><p className="mt-1 text-xs text-muted-foreground">{balanceQuery.data?.balance && balanceQuery.data.balance.balanceMinutes < 0 ? 'Em atraso' : balanceQuery.data?.balance ? 'Saldo positivo' : 'Sem saldo configurado'}</p></CardContent></Card><Card className="border-border/70 shadow-none"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Atrasos acumulados</p><p className="mt-2 text-3xl font-semibold tabular-nums">{delaysQuery.data ? formatDuration(delaysQuery.data.totalLateMinutes) : '—'}</p><TimerReset className="mt-2 size-4 text-muted-foreground" /></CardContent></Card><Card className="border-border/70 shadow-none"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Horário</p><p className="mt-2 text-xl font-semibold tabular-nums">{scheduleQuery.data ? `${scheduleQuery.data.startTime}–${scheduleQuery.data.endTime}` : '—'}</p><Clock3 className="mt-2 size-4 text-muted-foreground" /></CardContent></Card></section>

      {scheduleQuery.isLoading && <LoadingState rows={2} />}
      {scheduleQuery.isError && <EmptyState title="Horário indisponível" description="Não foi possível carregar o horário de trabalho deste usuário." action={<Button variant="outline" onClick={() => void scheduleQuery.refetch()}>Tentar novamente</Button>} />}
      {scheduleQuery.data === null && <EmptyState title="Horário ainda não configurado" description="Este usuário ainda não possui uma jornada para editar." />}
      {scheduleQuery.data && <Card className="border-border/70 shadow-none"><CardHeader><CardTitle className="text-lg">Editar horário de trabalho</CardTitle></CardHeader><CardContent><WorkScheduleForm schedule={scheduleQuery.data} onSubmit={(values) => scheduleMutation.mutate(values)} isSubmitting={scheduleMutation.isPending} idPrefix="admin-user-work-schedule" /></CardContent></Card>}

      <Card className="border-border/70 shadow-none"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><KeyRound className="size-4" /> Alterar senha</CardTitle></CardHeader><CardContent><form className="flex max-w-lg flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleSubmit((values) => passwordMutation.mutate(values))}><div className="flex-1 space-y-2"><Label htmlFor="new-password">Nova senha</Label><Input id="new-password" type="password" {...register('password')} aria-invalid={Boolean(errors.password)} />{errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}</div><Button type="submit" disabled={passwordMutation.isPending || Boolean(impersonatedUser)}>{impersonatedUser ? 'Saia da visualização para editar' : passwordMutation.isPending ? 'Salvando…' : 'Salvar senha'}</Button></form></CardContent></Card>

      <Card className="border-border/70 shadow-none"><CardHeader className="flex-row items-end justify-between space-y-0"><div><CardTitle className="text-lg">Registros recentes</CardTitle><p className="mt-1 text-sm text-muted-foreground">Últimas jornadas consolidadas pela API.</p></div><Button variant="outline" size="sm" asChild><Link to="/admin/records">Ver todos</Link></Button></CardHeader><CardContent>{entriesQuery.isLoading && <LoadingState rows={3} />}{!entriesQuery.isLoading && recentEntries.length === 0 && <EmptyState title="Sem registros" description="Este perfil ainda não possui jornadas consolidadas." />}{recentEntries.length > 0 && <div className="divide-y">{recentEntries.map(({ date, entry }) => <div key={date} className="flex items-center justify-between gap-4 py-4"><div><p className="font-medium capitalize">{formatDateKey(date)}</p><p className="text-sm text-muted-foreground">Entrada às {formatDateTime(entry.occurredAt)}</p></div><p className="text-sm font-medium">{entry.clockOut ? `Saída às ${formatDateTime(entry.clockOut)}` : 'Em andamento'}</p></div>)}</div>}</CardContent></Card>

      <Card className="border-border/70 shadow-none"><CardHeader><CardTitle className="text-lg">Atrasos recentes</CardTitle></CardHeader><CardContent>{delaysQuery.isLoading && <LoadingState rows={3} />}{!delaysQuery.isLoading && delaysQuery.data?.days.length === 0 && <EmptyState title="Sem atrasos" description="A API não retornou dias com atraso para este perfil." />}{delaysQuery.data?.days.map((day) => <div key={`${day.date}-${day.clockIn}`} className="flex items-center justify-between gap-4 border-b py-3 last:border-0"><div><p className="font-medium">{formatDateKey(day.date)}</p><p className="text-sm text-muted-foreground">Esperado às {day.expectedTime}</p></div><Badge variant="outline">{formatDuration(day.lateMinutes)}</Badge></div>)}</CardContent></Card>
    </div>
  )
}
