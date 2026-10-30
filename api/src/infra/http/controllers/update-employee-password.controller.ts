import type { UpdateEmployeePasswordUseCase } from '@src/domain/manage/application/use-cases/admin/update-employee-password'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { sendAdminError } from './admin-error-response'

export const employeeIdParamsSchema = z.object({ employeeId: z.string().min(1) })

export const updateEmployeePasswordBodySchema = z.object({
	password: z.string().min(8).max(100),
})

export class UpdateEmployeePasswordController {
	constructor(private readonly useCase: UpdateEmployeePasswordUseCase) {}

	async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
		try {
			const { employeeId } = employeeIdParamsSchema.parse(request.params)
			const { password } = updateEmployeePasswordBodySchema.parse(request.body)
			const result = await this.useCase.execute({
				requesterId: request.auth!.id,
				employeeId,
				password,
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
