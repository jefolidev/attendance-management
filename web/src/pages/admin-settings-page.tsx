import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { WorkScheduleForm } from '@/components/shared/work-schedule-form'
import { useAuth } from '@/features/auth/use-auth'
import { getErrorMessage } from '@/lib/formatters'
import type { WorkScheduleFormValues } from '@/lib/work-schedule-schema'
import { getAdminEmployeeWorkSchedule, getAdminEmployees, updateAdminEmployeeWorkSchedule } from '@/services/admin-service'
import { toast } from 'sonner'

export function AdminSettingsPage() {
  const { impersonatedUser, setImpersonatedUser } = useAuth()
  const queryClient = useQueryClient()
  const employeesQuery = useQuery({ queryKey: ['admin-settings-employees'], queryFn: () => getAdminEmployees(1, 100, 'desc') })
  const scheduleQuery = useQuery({ queryKey: ['admin-work-schedule', impersonatedUser?.id], queryFn: () => getAdminEmployeeWorkSchedule(impersonatedUser!.id), enabled: Boolean(impersonatedUser) })
  const updateMutation = useMutation({ mutationFn: (values: WorkScheduleFormValues) => updateAdminEmployeeWorkSchedule(impersonatedUser!.id, values), onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['admin-work-schedule', impersonatedUser?.id] }), queryClient.invalidateQueries({ queryKey: ['admin-records', impersonatedUser?.id] }), queryClient.invalidateQueries({ queryKey: ['admin-dashboard-entries', impersonatedUser?.id] }), queryClient.invalidateQueries({ queryKey: ['admin-dashboard-delays', impersonatedUser?.id] })]); toast.success('Horário do perfil atualizado.') }, onError: (error) => toast.error(getErrorMessage(error)) })

  return (
    <div className="space-y-8">
      <PageHeader title="Configurações" description="A API atual permite editar o horário de trabalho por perfil." />
      <Card className="border-border/70 shadow-none"><CardHeader><CardTitle className="text-lg font-medium">Perfil administrado</CardTitle></CardHeader><CardContent><select aria-label="Perfil administrado" className="flex h-9 w-full max-w-md rounded-lg border border-input bg-background px-3 text-sm" value={impersonatedUser?.id || ''} onChange={(event) => { const user = employeesQuery.data?.employees.find((employee) => employee.id === event.target.value); if (user) setImpersonatedUser(user) }}><option value="">Selecione um perfil</option>{employeesQuery.data?.employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.username}</option>)}</select></CardContent></Card>

      {!impersonatedUser && <EmptyState title="Selecione um perfil" description="Não há configurações globais expostas pela API. Selecione um usuário para editar seu horário." action={<Button asChild><Link to="/admin/select-profile">Escolher perfil</Link></Button>} />}
      {impersonatedUser && scheduleQuery.isLoading && <LoadingState rows={3} />}
      {impersonatedUser && scheduleQuery.isError && <EmptyState title="Horário indisponível" description="Este perfil não possui um horário configurado ou a API não respondeu." action={<Button variant="outline" onClick={() => void scheduleQuery.refetch()}>Tentar novamente</Button>} />}
      {impersonatedUser && scheduleQuery.data === null && <EmptyState title="Horário ainda não configurado" description="A API atual permite editar horários existentes, mas não criar uma jornada nova por esta tela." />}
      {impersonatedUser && scheduleQuery.data && <Card className="border-border/70 shadow-none"><CardHeader><CardTitle className="text-lg font-medium">Horário de trabalho de {impersonatedUser.username}</CardTitle></CardHeader><CardContent><WorkScheduleForm schedule={scheduleQuery.data} onSubmit={(values) => updateMutation.mutate(values)} isSubmitting={updateMutation.isPending} idPrefix="admin-work-schedule" /></CardContent></Card>}
    </div>
  )
}
