import { z } from 'zod'

const timePattern = /^\d{2}:\d{2}$/

const dayOverrideSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timePattern, 'Informe um horário válido.').optional(),
  endTime: z.string().regex(timePattern, 'Informe um horário válido.').optional(),
})

export const workScheduleFormSchema = z.object({
  startTime: z.string().regex(timePattern, 'Informe um horário válido.'),
  endTime: z.string().regex(timePattern, 'Informe um horário válido.'),
  breaksPerDay: z.number().int('Informe um número inteiro.').min(0, 'Informe zero ou mais pausas.'),
  lateTolerance: z.number().int('Informe um número inteiro.').min(0, 'Informe zero ou mais minutos.'),
  days: z.array(z.number().int().min(0).max(6)).min(1, 'Selecione pelo menos um dia de trabalho.'),
  dayOverrides: z.array(dayOverrideSchema),
})

export type WorkScheduleFormValues = z.infer<typeof workScheduleFormSchema>
