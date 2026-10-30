import type { UpdateEmployeeTimeEntryUseCase } from '@src/domain/manage/application/use-cases/admin/update-employee-time-entry'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { sendAdminError } from './admin-error-response'

export const updateEmployeeTimeEntryParamsSchema = z.object({
	employeeId: z.string().min(1),
	timeEntryId: z.string().min(1),
})

export const updateEmployeeTimeEntryBodySchema = z
	.object({
		clockIn: z.coerce.date().optional(),
		clockOut: z.coerce.date().optional(),
	})
	.refine((body) => body.clockIn !== undefined || body.clockOut !== undefined, {
		message: 'At least one time must be provided',
	})

export class UpdateEmployeeTimeEntryController {
	constructor(private readonly useCase: UpdateEmployeeTimeEntryUseCase) {}

	async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
		try {
			const { employeeId, timeEntryId } = updateEmployeeTimeEntryParamsSchema.parse(
				request.params,
			)
			const body = updateEmployeeTimeEntryBodySchema.parse(request.body)
			const result = await this.useCase.execute({
				requesterId: request.auth!.id,
				employeeId,
				timeEntryId,
				...body,
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
