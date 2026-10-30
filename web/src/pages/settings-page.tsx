import { LogOut } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { WorkScheduleForm } from '@/components/shared/work-schedule-form'
import { useAuth } from '@/features/auth/use-auth'
import { getErrorMessage } from '@/lib/formatters'
import type { WorkScheduleFormValues } from '@/lib/work-schedule-schema'
import { createWorkSchedule, getWorkSchedule, updateWorkSchedule } from '@/services/work-schedule-service'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { toast } from 'sonner'

export function SettingsPage() {
  const { logout } = useAuth()
  const queryClient = useQueryClient()
  const scheduleQuery = useQuery({ queryKey: ['work-schedule'], queryFn: getWorkSchedule })

  const onSubmit = async (values: WorkScheduleFormValues) => {
    try {
      if (scheduleQuery.data) {
        await updateWorkSchedule(values)
      } else {
        await createWorkSchedule(values)
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['work-schedule'] }),
        queryClient.invalidateQueries({ queryKey: ['time-entries'] }),
        queryClient.invalidateQueries({ queryKey: ['accumulated-delay'] }),
      ])
      toast.success(scheduleQuery.data ? 'Horário de trabalho atualizado.' : 'Horário de trabalho configurado.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Configurações" description="Ajuste sua jornada e preferências de acesso." />

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Horário de trabalho</CardTitle>
          {!scheduleQuery.data && !scheduleQuery.isLoading && !scheduleQuery.isError && <p className="text-sm text-muted-foreground">Configure sua jornada para liberar o registro de ponto.</p>}
        </CardHeader>
        <CardContent>
          {scheduleQuery.isLoading && <LoadingState rows={2} />}
          {scheduleQuery.isError && <EmptyState title="Horário indisponível" description="Não foi possível carregar o horário de trabalho." action={<Button variant="outline" onClick={() => void scheduleQuery.refetch()}>Tentar novamente</Button>} />}
          {!scheduleQuery.isLoading && !scheduleQuery.isError && (
            <WorkScheduleForm schedule={scheduleQuery.data} onSubmit={onSubmit} idPrefix="user-work-schedule" submitLabel={scheduleQuery.data ? 'Salvar alterações' : 'Configurar horário'} />
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader><CardTitle className="text-lg font-medium">Preferências</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div><p className="text-sm font-medium">Tema da interface</p><p className="text-sm text-muted-foreground">A escolha fica salva neste dispositivo.</p></div>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader><CardTitle className="text-lg font-medium">Conta</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Encerre a sessão neste dispositivo.</p>
          <Button variant="outline" className="gap-2" onClick={logout}><LogOut className="size-4" />Sair</Button>
        </CardContent>
      </Card>
    </div>
  )
}

