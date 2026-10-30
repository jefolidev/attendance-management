import { z } from 'zod'

export const timeEntryJustificationTypeSchema = z.enum([
	'LATE_ARRIVAL',
	'EARLY_DEPARTURE',
])

export const timeEntryJustificationParamsSchema = z.object({
	employeeId: z.string().min(1),
	timeEntryId: z.string().min(1),
})

export const removeTimeEntryJustificationParamsSchema =
	timeEntryJustificationParamsSchema.extend({
		type: timeEntryJustificationTypeSchema,
	})

export const createTimeEntryJustificationBodySchema = z.object({
	type: timeEntryJustificationTypeSchema,
	category: z.literal('MEDICAL_EMERGENCY'),
	description: z.string().trim().max(500).optional(),
})
