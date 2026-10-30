import { DuplicatedError } from '@src/core/entities/errors/duplicated-error'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import type { CreateEmployeeUseCase } from '@src/domain/manage/application/use-cases/create-employee'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { sendAdminError } from './admin-error-response'

export const adminCreateEmployeeBodySchema = z.object({
	username: z.string().trim().min(2).max(100),
	password: z.string().min(8).max(100),
	role: z.enum(['ADMIN', 'EMPLOYEE']),
})

export class AdminCreateEmployeeController {
	constructor(private readonly useCase: CreateEmployeeUseCase) {}

	async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
		try {
			const body = adminCreateEmployeeBodySchema.parse(request.body)
			const result = await this.useCase.execute({
				...body,
				requesterId: request.auth!.id,
			})

			if (result.isLeft()) {
				if (result.value instanceof NotAllowedError) {
					reply.status(403).send({ error: result.value.message })
					return
				}

				if (result.value instanceof DuplicatedError) {
					reply.status(409).send({ error: result.value.message })
					return
				}
			}

			reply.status(201).send(result.value)
		} catch (error) {
			sendAdminError(error, reply)
		}
	}
}
