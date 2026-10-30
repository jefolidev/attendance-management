import type { ListEmployeesUseCase } from '@src/domain/manage/application/use-cases/admin/list-employees'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { sendAdminError } from './admin-error-response'

export const adminListEmployeesQuerySchema = z.object({
	page: z.coerce.number().int().positive().optional(),
	perPage: z.coerce.number().int().positive().max(100).optional(),
	sort: z.enum(['asc', 'desc']).optional(),
})

export class ListEmployeesController {
	constructor(private readonly useCase: ListEmployeesUseCase) {}

	async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
		try {
			const query = adminListEmployeesQuerySchema.parse(request.query)
			const result = await this.useCase.execute({
				requesterId: request.auth!.id,
				...query,
			})

			if (result.isLeft()) {
				sendAdminError(result.value, reply)
				return
			}

			reply.status(200).send({
				employees: result.value.employees.map((employee) => ({
					...employee,
					createdAt: employee.createdAt.toISOString(),
					updatedAt: employee.updatedAt?.toISOString() ?? null,
				})),
			pagination: result.value.pagination,
			})
		} catch (error) {
			sendAdminError(error, reply)
		}
	}
}
