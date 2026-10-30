import type { GetEmployeeDelaysUseCase } from '@src/domain/manage/application/use-cases/admin/get-employee-delays'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { employeeIdParamsSchema } from './update-employee-password.controller'
import { sendAdminError } from './admin-error-response'

export const adminListDelaysQuerySchema = z.object({
	page: z.coerce.number().int().positive().optional(),
	perPage: z.coerce.number().int().positive().max(100).optional(),
	sort: z.enum(['asc', 'desc']).optional(),
})

export class GetEmployeeDelaysController {
	constructor(private readonly useCase: GetEmployeeDelaysUseCase) {}

	async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
		try {
			const { employeeId } = employeeIdParamsSchema.parse(request.params)
			const query = adminListDelaysQuerySchema.parse(request.query)
			const result = await this.useCase.execute({
				requesterId: request.auth!.id,
				employeeId,
				...query,
			})

			if (result.isLeft()) {
				sendAdminError(result.value, reply)
				return
			}

			reply.status(200).send(result.value)
		} catch (error) {
			sendAdminError(error, reply)
		}
	}
}
