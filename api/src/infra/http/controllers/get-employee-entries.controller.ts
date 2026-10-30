import type { GetEmployeeEntriesUseCase } from '@src/domain/manage/application/use-cases/admin/get-employee-entries'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { presentEntriesAndStatisticsList } from '../presenters/entries-and-statistics.presenter'
import { sendAdminError } from './admin-error-response'
import { employeeIdParamsSchema } from './update-employee-password.controller'

export const adminListEntriesQuerySchema = z.object({
	page: z.coerce.number().int().positive().optional(),
	perPage: z.coerce.number().int().positive().max(100).optional(),
	sort: z.enum(['asc', 'desc']).optional(),
})

export class GetEmployeeEntriesController {
	constructor(private readonly useCase: GetEmployeeEntriesUseCase) {}

	async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
		try {
			const { employeeId } = employeeIdParamsSchema.parse(request.params)
			const query = adminListEntriesQuerySchema.parse(request.query)
			const result = await this.useCase.execute({
				requesterId: request.auth!.id,
				employeeId,
				...query,
			})

			if (result.isLeft()) {
				sendAdminError(result.value, reply)
				return
			}

			reply.status(200).send({
				entries: presentEntriesAndStatisticsList(result.value.entries),
				pagination: result.value.pagination,
			})
		} catch (error) {
			sendAdminError(error, reply)
		}
	}
}
