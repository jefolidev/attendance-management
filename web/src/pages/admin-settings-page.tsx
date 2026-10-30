import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { useEffect, type ComponentProps } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { DayOverridesField, WorkDaysField } from '@/components/shared/work-schedule-fields'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/use-auth'
import { getErrorMessage } from '@/lib/formatters'
import { getAdminEmployeeWorkSchedule, getAdminEmployees, updateAdminEmployeeWorkSchedule } from '@/services/admin-service'
import type { WorkScheduleDayOverride } from '@/services/work-schedule-service'
import { toast } from 'sonner'

const scheduleSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Informe um horário válido.'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Informe um horário válido.'),
  lateTolerance: z.coerce.number().int().nonnegative('Use um valor positivo ou zero.'),
  breaksPerDay: z.coerce.number().int().nonnegative('Use um valor positivo ou zero.'),
  days: z.array(z.number().int().min(0).max(6)).min(1, 'Selecione pelo menos um dia de trabalho.'),
  dayOverrides: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Informe um horário válido.').optional(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Informe um horário válido.').optional(),
  })),
})

type ScheduleForm = z.input<typeof scheduleSchema>
type ScheduleSubmit = z.output<typeof scheduleSchema>

export function AdminSettingsPage() {
  const { impersonatedUser, setImpersonatedUser } = useAuth()
  const queryClient = useQueryClient()
  const employeesQuery = useQuery({ queryKey: ['admin-settings-employees'], queryFn: () => getAdminEmployees(1, 100, 'desc') })
  const scheduleQuery = useQuery({ queryKey: ['admin-work-schedule', impersonatedUser?.id], queryFn: () => getAdminEmployeeWorkSchedule(impersonatedUser!.id), enabled: Boolean(impersonatedUser) })
  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<ScheduleForm, unknown, ScheduleSubmit>({ resolver: zodResolver(scheduleSchema), defaultValues: { startTime: '', endTime: '', lateTolerance: 0, breaksPerDay: 0, days: [], dayOverrides: [] } })
  const selectedDays = useWatch({ control, name: 'days' })
  const selectedOverrides = useWatch({ control, name: 'dayOverrides' })
  const updateMutation = useMutation({ mutationFn: (values: ScheduleSubmit) => updateAdminEmployeeWorkSchedule(impersonatedUser!.id, values), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin-work-schedule', impersonatedUser?.id] }); toast.success('Horário do perfil atualizado.') }, onError: (error) => toast.error(getErrorMessage(error)) })

  useEffect(() => {
    if (!scheduleQuery.data) return
    reset({ startTime: scheduleQuery.data.startTime, endTime: scheduleQuery.data.endTime, lateTolerance: scheduleQuery.data.lateTolerance, breaksPerDay: scheduleQuery.data.breaksPerDay, days: scheduleQuery.data.days, dayOverrides: scheduleQuery.data.dayOverrides })
  }, [reset, scheduleQuery.data])

  return (
    <div className="space-y-8">
      <PageHeader title="Configurações" description="A API atual permite editar o horário de trabalho por perfil." />
      <Card className="border-border/70 shadow-none"><CardHeader><CardTitle className="text-lg font-medium">Perfil administrado</CardTitle></CardHeader><CardContent><select aria-label="Perfil administrado" className="flex h-9 w-full max-w-md rounded-lg border border-input bg-background px-3 text-sm" value={impersonatedUser?.id || ''} onChange={(event) => { const user = employeesQuery.data?.employees.find((employee) => employee.id === event.target.value); if (user) setImpersonatedUser(user) }}><option value="">Selecione um perfil</option>{employeesQuery.data?.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.username}</option>)}</select></CardContent></Card>

      {!impersonatedUser && <EmptyState title="Selecione um perfil" description="Não há configurações globais expostas pela API. Selecione um usuário para editar seu horário." action={<Button asChild><Link to="/admin/select-profile">Escolher perfil</Link></Button>} />}
      {impersonatedUser && scheduleQuery.isLoading && <LoadingState rows={3} />}
      {impersonatedUser && scheduleQuery.isError && <EmptyState title="Horário indisponível" description="Este perfil não possui um horário configurado ou a API não respondeu." action={<Button variant="outline" onClick={() => void scheduleQuery.refetch()}>Tentar novamente</Button>} />}
      {impersonatedUser && scheduleQuery.data === null && <EmptyState title="Horário ainda não configurado" description="A API atual permite editar horários existentes, mas não criar uma jornada nova por esta tela." />}
      {impersonatedUser && scheduleQuery.data && <Card className="border-border/70 shadow-none"><CardHeader><CardTitle className="text-lg font-medium">Horário de trabalho de {impersonatedUser.username}</CardTitle></CardHeader><CardContent><form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit((values) => updateMutation.mutate(values))}><TimeField id="admin-start-time" label="Horário de entrada" error={errors.startTime?.message} {...register('startTime')} /><TimeField id="admin-end-time" label="Horário de saída" error={errors.endTime?.message} {...register('endTime')} /><NumberField id="admin-tolerance" label="Tolerância em minutos" error={errors.lateTolerance?.message} {...register('lateTolerance')} /><NumberField id="admin-breaks" label="Pausas por dia" error={errors.breaksPerDay?.message} {...register('breaksPerDay')} /><WorkDaysField value={selectedDays} error={errors.days?.message} onChange={(days) => setValue('days', days, { shouldValidate: true })} /><DayOverridesField days={selectedDays} value={selectedOverrides as WorkScheduleDayOverride[]} onChange={(dayOverrides) => setValue('dayOverrides', dayOverrides, { shouldValidate: true })} /><div className="flex justify-end sm:col-span-2"><Button type="submit" className="gap-2" disabled={updateMutation.isPending}><Save className="size-4" />{updateMutation.isPending ? 'Salvando…' : 'Salvar alterações'}</Button></div></form></CardContent></Card>}
    </div>
  )
}

function TimeField({ id, label, hint, error, ...props }: ComponentProps<typeof Input> & { label: string; hint?: string; error?: string }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}{hint && <span className="ml-1 text-muted-foreground">({hint})</span>}</Label><Input id={id} type="time" aria-invalid={Boolean(error)} {...props} />{error && <p className="text-xs text-destructive">{error}</p>}</div>
}

function NumberField({ id, label, error, ...props }: ComponentProps<typeof Input> & { label: string; error?: string }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} type="number" min="0" aria-invalid={Boolean(error)} {...props} />{error && <p className="text-xs text-destructive">{error}</p>}</div>
}
