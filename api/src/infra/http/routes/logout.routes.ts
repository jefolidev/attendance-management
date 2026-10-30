import type { FastifyInstance } from 'fastify'
import { LogoutEmployeeUseCase } from '@src/domain/manage/application/use-cases/logout-employee'
import { LogoutController } from '../controllers/logout.controller'

export default async function logoutRoute(fastify: FastifyInstance): Promise<void> {
	const logoutEmployeeUseCase = new LogoutEmployeeUseCase(fastify.tokenInvalidator)
	const controller = new LogoutController(logoutEmployeeUseCase, fastify)

	fastify.route({
		method: 'POST',
		url: '/logout',
		schema: { tags: ['auth'] },
		handler: controller.handle.bind(controller),
	})
}
