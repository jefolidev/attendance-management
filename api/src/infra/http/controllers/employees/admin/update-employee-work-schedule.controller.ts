import type { UpdateEmployeeWorkScheduleUseCase } from '@src/domain/manage/application/use-cases/admin/update-employee-work-schedule'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { employeeIdParamsSchema } from './update-employee-password.controller'
import { sendAdminError } from './admin-error-response'

export const updateEmployeeWorkScheduleBodySchema = z
	.object({
		startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
		endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
		breakStartTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
		breakEndTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
		lateTolerance: z.number().int().nonnegative().optional(),
		breaksPerDay: z.number().int().nonnegative().optional(),
		days: z.array(z.number().int().min(0).max(6)).nonempty().optional(),
	})
	.refine((body) => Object.keys(body).length > 0, {
		message: 'At least one field must be provided',
	})

export class UpdateEmployeeWorkScheduleController {
	constructor(private readonly useCase: UpdateEmployeeWorkScheduleUseCase) {}

	async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
		try {
			const { employeeId } = employeeIdParamsSchema.parse(request.params)
			const body = updateEmployeeWorkScheduleBodySchema.parse(request.body)
			const result = await this.useCase.execute({
				...body,
				requesterId: request.auth!.id,
				employeeId,
			})

			if (result.isLeft()) {
				sendAdminError(result.value, reply)
				return
			}

			reply.status(204).send()
		} catch (error) {
			sendAdminError(error, reply)
		}
	}
}
