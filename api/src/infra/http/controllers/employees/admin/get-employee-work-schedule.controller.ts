import type { GetEmployeeWorkScheduleUseCase } from '@src/domain/manage/application/use-cases/admin/get-employee-work-schedule'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { presentWorkSchedule } from '../../../presenters/work-schedule.presenter'
import { sendAdminError } from './admin-error-response'
import { employeeIdParamsSchema } from './update-employee-password.controller'

export class GetEmployeeWorkScheduleController {
	constructor(private readonly useCase: GetEmployeeWorkScheduleUseCase) {}

	async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
		try {
			const { employeeId } = employeeIdParamsSchema.parse(request.params)
			const result = await this.useCase.execute({
				requesterId: request.auth!.id,
				employeeId,
			})

			if (result.isLeft()) {
				sendAdminError(result.value, reply)
				return
			}

			reply.status(200).send(presentWorkSchedule(result.value))
		} catch (error) {
			sendAdminError(error, reply)
		}
	}
}
