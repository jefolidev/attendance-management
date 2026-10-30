import { zodResolver } from '@hookform/resolvers/zod'
import { LogOut, Save } from 'lucide-react'
import { useEffect, type ComponentProps } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { useAuth } from '@/features/auth/use-auth'
import { getErrorMessage } from '@/lib/formatters'
import { getWorkSchedule, updateWorkSchedule } from '@/services/work-schedule-service'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { toast } from 'sonner'

const timePattern = /^\d{2}:\d{2}$/

const workScheduleSchema = z.object({
  startTime: z.string().regex(timePattern, 'Informe um horário válido.'),
  endTime: z.string().regex(timePattern, 'Informe um horário válido.'),
})

type WorkScheduleForm = z.infer<typeof workScheduleSchema>

export function SettingsPage() {
  const { logout } = useAuth()
  const queryClient = useQueryClient()
  const scheduleQuery = useQuery({ queryKey: ['work-schedule'], queryFn: getWorkSchedule })
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<WorkScheduleForm>({
    resolver: zodResolver(workScheduleSchema),
    defaultValues: { startTime: '', endTime: '' },
  })

  useEffect(() => {
    if (!scheduleQuery.data) return
    reset({
      startTime: scheduleQuery.data.startTime,
      endTime: scheduleQuery.data.endTime,
    })
  }, [reset, scheduleQuery.data])

  const onSubmit = async (values: WorkScheduleForm) => {
    try {
      await updateWorkSchedule({
        startTime: values.startTime,
        endTime: values.endTime,
      })
      await queryClient.invalidateQueries({ queryKey: ['work-schedule'] })
      toast.success('Horário de trabalho atualizado.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Configurações" description="Ajuste sua jornada e preferências de acesso." />

      <Card className="border-border/70 shadow-none">
        <CardHeader><CardTitle className="text-lg font-medium">Horário de trabalho</CardTitle></CardHeader>
        <CardContent>
          {scheduleQuery.isLoading && <LoadingState rows={2} />}
          {scheduleQuery.isError && <EmptyState title="Horário indisponível" description="Não foi possível carregar o horário de trabalho." action={<Button variant="outline" onClick={() => void scheduleQuery.refetch()}>Tentar novamente</Button>} />}
          {scheduleQuery.data && (
            <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
              <TimeField id="start-time" label="Horário de entrada" error={errors.startTime?.message} {...register('startTime')} />
              <TimeField id="end-time" label="Horário de saída" error={errors.endTime?.message} {...register('endTime')} />
              <div className="flex justify-end sm:col-span-2">
                <Button type="submit" className="gap-2" disabled={isSubmitting}><Save className="size-4" />{isSubmitting ? 'Salvando…' : 'Salvar alterações'}</Button>
              </div>
            </form>
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

type TimeFieldProps = ComponentProps<typeof Input> & { label: string; hint?: string; error?: string }

function TimeField({ id, label, hint, error, ...props }: TimeFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}{hint && <span className="ml-1 text-muted-foreground">({hint})</span>}</Label>
      <Input id={id} type="time" aria-invalid={Boolean(error)} {...props} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
