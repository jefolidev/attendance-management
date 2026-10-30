import type { ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { WorkScheduleDayOverride } from '@/services/work-schedule-service'

const weekDays = [
  { value: 1, label: 'Seg', fullLabel: 'Segunda-feira' },
  { value: 2, label: 'Ter', fullLabel: 'Terça-feira' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta-feira' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta-feira' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta-feira' },
  { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
  { value: 0, label: 'Dom', fullLabel: 'Domingo' },
]

export function WorkDaysField({ value, error, onChange }: { value: number[]; error?: string; onChange: (days: number[]) => void }) {
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

export function DayOverridesField({ days, value, onChange }: { days: number[]; value: WorkScheduleDayOverride[]; onChange: (overrides: WorkScheduleDayOverride[]) => void }) {
  const activeDays = weekDays.filter((day) => days.includes(day.value))

  return (
    <div className="space-y-3 sm:col-span-2">
      <div>
        <Label>Horários diferentes por dia</Label>
        <p className="mt-1 text-sm text-muted-foreground">Use esta opção para jornadas como a sexta-feira com saída antecipada.</p>
      </div>
      {activeDays.length === 0 ? <p className="text-sm text-muted-foreground">Selecione os dias de trabalho para configurar exceções.</p> : activeDays.map((day) => {
        const override = value.find((item) => item.dayOfWeek === day.value)
        const setOverride = (changes: Partial<WorkScheduleDayOverride>) => {
          const next = value.some((item) => item.dayOfWeek === day.value)
            ? value.map((item) => item.dayOfWeek === day.value ? { ...item, ...changes } : item)
            : [...value, { dayOfWeek: day.value, ...changes }]
          onChange(next)
        }

        return (
          <div key={day.value} className="rounded-xl border border-border/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium">{day.fullLabel}</p>
              <Button type="button" size="sm" variant={override ? 'secondary' : 'outline'} onClick={() => onChange(override ? value.filter((item) => item.dayOfWeek !== day.value) : [...value, { dayOfWeek: day.value }])}>
                {override ? 'Remover exceção' : 'Usar horário diferente'}
              </Button>
            </div>
            {override && <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <OverrideTimeField id={`override-start-${day.value}`} label="Entrada específica" value={override.startTime} onChange={(event) => setOverride({ startTime: event.target.value || undefined })} />
              <OverrideTimeField id={`override-end-${day.value}`} label="Saída específica" value={override.endTime} onChange={(event) => setOverride({ endTime: event.target.value || undefined })} />
            </div>}
          </div>
        )
      })}
    </div>
  )
}

function OverrideTimeField({ id, label, value, onChange }: { id: string; label: string; value?: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label} <span className="text-muted-foreground">(opcional)</span></Label>
      <Input id={id} type="text" inputMode="numeric" placeholder="HH:mm" maxLength={5} pattern="[0-9]{2}:[0-9]{2}" value={value ?? ''} onChange={onChange} />
    </div>
  )
}
