import type { CreateTimeEntryJustificationUseCase } from '@src/domain/manage/application/use-cases/admin/create-time-entry-justification'
import type { FastifyReply, FastifyRequest } from 'fastify'
import {
	createTimeEntryJustificationBodySchema,
	timeEntryJustificationParamsSchema,
} from './time-entry-justification.schemas'
import { sendAdminError } from './admin-error-response'

export class CreateTimeEntryJustificationController {
	constructor(private readonly useCase: CreateTimeEntryJustificationUseCase) {}

	async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
		try {
			const params = timeEntryJustificationParamsSchema.parse(request.params)
			const body = createTimeEntryJustificationBodySchema.parse(request.body)
			const result = await this.useCase.execute({
				requesterId: request.auth!.id,
				employeeId: params.employeeId,
				timeEntryId: params.timeEntryId,
				...body,
			})

			if (result.isLeft()) {
				sendAdminError(result.value, reply)
				return
			}

			reply.status(201).send(result.value)
		} catch (error) {
			sendAdminError(error, reply)
		}
	}
}
