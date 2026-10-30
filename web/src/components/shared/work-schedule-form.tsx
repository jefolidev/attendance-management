import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, type ComponentProps } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DayOverridesField, WorkDaysField } from '@/components/shared/work-schedule-fields'
import { workScheduleFormSchema, type WorkScheduleFormValues } from '@/lib/work-schedule-schema'
import type { WorkSchedule } from '@/services/work-schedule-service'

interface WorkScheduleFormProps {
  schedule?: WorkSchedule | null
  onSubmit: (values: WorkScheduleFormValues) => void | Promise<void>
  isSubmitting?: boolean
  idPrefix?: string
  submitLabel?: string
}

export function WorkScheduleForm({
  schedule,
  onSubmit,
  isSubmitting = false,
  idPrefix = 'work-schedule',
  submitLabel,
}: WorkScheduleFormProps) {
  const { register, control, handleSubmit, reset, setValue, formState: { errors, isSubmitting: formIsSubmitting } } = useForm<WorkScheduleFormValues>({
    resolver: zodResolver(workScheduleFormSchema),
    defaultValues: getDefaultValues(schedule),
  })
  const selectedDays = useWatch({ control, name: 'days' }) ?? []
  const selectedOverrides = useWatch({ control, name: 'dayOverrides' }) ?? []
  const saving = isSubmitting || formIsSubmitting

  useEffect(() => {
    reset(getDefaultValues(schedule))
  }, [reset, schedule])

  return (
    <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <TimeField id={`${idPrefix}-start-time`} label="Horário de entrada" error={errors.startTime?.message} {...register('startTime')} />
      <TimeField id={`${idPrefix}-end-time`} label="Horário de saída" error={errors.endTime?.message} {...register('endTime')} />
      <NumberField id={`${idPrefix}-breaks-per-day`} label="Quantidade de pausas" hint="por dia" error={errors.breaksPerDay?.message} {...register('breaksPerDay', { valueAsNumber: true })} />
      <NumberField id={`${idPrefix}-late-tolerance`} label="Tolerância de atraso" hint="em minutos" error={errors.lateTolerance?.message} {...register('lateTolerance', { valueAsNumber: true })} />
      <WorkDaysField value={selectedDays} error={errors.days?.message} onChange={(days) => setValue('days', days, { shouldValidate: true })} />
      <DayOverridesField days={selectedDays} value={selectedOverrides} onChange={(dayOverrides) => setValue('dayOverrides', dayOverrides, { shouldValidate: true })} />
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" disabled={saving}>{saving ? 'Salvando…' : submitLabel ?? (schedule ? 'Salvar alterações' : 'Configurar horário')}</Button>
      </div>
    </form>
  )
}

function getDefaultValues(schedule?: WorkSchedule | null): WorkScheduleFormValues {
  return {
    startTime: schedule?.startTime ?? '',
    endTime: schedule?.endTime ?? '',
    breaksPerDay: schedule?.breaksPerDay ?? 0,
    lateTolerance: schedule?.lateTolerance ?? 0,
    days: schedule?.days ?? [],
    dayOverrides: schedule?.dayOverrides ?? [],
  }
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
