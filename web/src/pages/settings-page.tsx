import { zodResolver } from '@hookform/resolvers/zod'
import { LogOut, Save } from 'lucide-react'
import { useEffect, type ComponentProps } from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
import { createWorkSchedule, getWorkSchedule, updateWorkSchedule } from '@/services/work-schedule-service'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { toast } from 'sonner'

const timePattern = /^\d{2}:\d{2}$/

const workScheduleSchema = z.object({
  startTime: z.string().regex(timePattern, 'Informe um horário válido.'),
  endTime: z.string().regex(timePattern, 'Informe um horário válido.'),
  breaksPerDay: z.number().int('Informe um número inteiro.').min(0, 'Informe zero ou mais pausas.'),
  lateTolerance: z.number().int('Informe um número inteiro.').min(0, 'Informe zero ou mais minutos.'),
  days: z.array(z.number().int().min(0).max(6)).min(1, 'Selecione pelo menos um dia de trabalho.'),
})

type WorkScheduleForm = z.infer<typeof workScheduleSchema>

export function SettingsPage() {
  const { logout } = useAuth()
  const queryClient = useQueryClient()
  const scheduleQuery = useQuery({ queryKey: ['work-schedule'], queryFn: getWorkSchedule })
  const { register, control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<WorkScheduleForm>({
    resolver: zodResolver(workScheduleSchema),
    defaultValues: { startTime: '', endTime: '', breaksPerDay: 0, lateTolerance: 0, days: [] },
  })
  const selectedDays = useWatch({ control, name: 'days' })

  useEffect(() => {
    if (!scheduleQuery.data) return
    reset({
      startTime: scheduleQuery.data.startTime,
      endTime: scheduleQuery.data.endTime,
      breaksPerDay: scheduleQuery.data.breaksPerDay,
      lateTolerance: scheduleQuery.data.lateTolerance,
      days: scheduleQuery.data.days,
    })
  }, [reset, scheduleQuery.data])

  const onSubmit = async (values: WorkScheduleForm) => {
    try {
      if (scheduleQuery.data) {
        await updateWorkSchedule({
          startTime: values.startTime,
          endTime: values.endTime,
          breaksPerDay: values.breaksPerDay,
          lateTolerance: values.lateTolerance,
        })
      } else {
        await createWorkSchedule(values)
      }
      await queryClient.invalidateQueries({ queryKey: ['work-schedule'] })
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
            <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
              <TimeField id="start-time" label="Horário de entrada" error={errors.startTime?.message} {...register('startTime')} />
              <TimeField id="end-time" label="Horário de saída" error={errors.endTime?.message} {...register('endTime')} />
              <NumberField id="breaks-per-day" label="Quantidade de pausas" hint="por dia" error={errors.breaksPerDay?.message} {...register('breaksPerDay', { valueAsNumber: true })} />
              <NumberField id="late-tolerance" label="Tolerância de atraso" hint="em minutos" error={errors.lateTolerance?.message} {...register('lateTolerance', { valueAsNumber: true })} />
              {!scheduleQuery.data && <WorkDaysField value={selectedDays} error={errors.days?.message} onChange={(days) => setValue('days', days, { shouldValidate: true })} />}
              <div className="flex justify-end sm:col-span-2">
                <Button type="submit" className="gap-2" disabled={isSubmitting}><Save className="size-4" />{isSubmitting ? 'Salvando…' : scheduleQuery.data ? 'Salvar alterações' : 'Configurar horário'}</Button>
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

type NumberFieldProps = ComponentProps<typeof Input> & { label: string; hint?: string; error?: string }

function NumberField({ id, label, hint, error, ...props }: NumberFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}{hint && <span className="ml-1 text-muted-foreground">({hint})</span>}</Label>
      <Input id={id} type="number" min={0} step={1} aria-invalid={Boolean(error)} {...props} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

const weekDays = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
]

function WorkDaysField({ value, error, onChange }: { value: number[]; error?: string; onChange: (days: number[]) => void }) {
  return (
    <div className="space-y-2 sm:col-span-2">
      <Label>Dias de trabalho</Label>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {weekDays.map((day) => {
          const selected = value.includes(day.value)
          return (
            <Button key={day.value} type="button" variant={selected ? 'secondary' : 'outline'} aria-pressed={selected} onClick={() => onChange(selected ? value.filter((item) => item !== day.value) : [...value, day.value])}>
              {day.label}
            </Button>
          )
        })}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
