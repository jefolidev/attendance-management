import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import type { LogoutEmployeeUseCase } from '@src/domain/manage/application/use-cases/logout-employee'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export class LogoutController {
	constructor(
		private readonly logoutEmployeeUseCase: LogoutEmployeeUseCase,
		private readonly fastify: FastifyInstance,
	) {}

	async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
		const token = this.fastify.jwtAuth.getTokenByCookieOrHeader(request)

		if (!token) {
			reply.status(401).send({ error: 'Unauthorized' })
			return
		}

		const result = await this.logoutEmployeeUseCase.execute({ token })

		if (result.isLeft()) {
			const error = result.value
			if (error instanceof BadRequestError) {
				reply.status(400).send({ error: error.message })
				return
			}
		}

		reply.clearCookie('access_token', { path: '/' })
		reply.status(204).send()
	}
}
