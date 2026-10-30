import { z } from 'zod'

const timePattern = /^\d{2}:\d{2}$/

const timeSchema = z.string()
  .regex(timePattern, 'Informe um horário válido no formato HH:mm.')
  .refine((value) => {
    const [hours, minutes] = value.split(':').map(Number)
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
  }, 'Informe um horário entre 00:00 e 23:59.')

const dayOverrideSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
})

export const workScheduleFormSchema = z.object({
  startTime: timeSchema,
  endTime: timeSchema,
  breaksPerDay: z.number().int('Informe um número inteiro.').min(0, 'Informe zero ou mais pausas.'),
  lateTolerance: z.number().int('Informe um número inteiro.').min(0, 'Informe zero ou mais minutos.'),
  days: z.array(z.number().int().min(0).max(6)).min(1, 'Selecione pelo menos um dia de trabalho.'),
  dayOverrides: z.array(dayOverrideSchema),
})

export type WorkScheduleFormValues = z.infer<typeof workScheduleFormSchema>
