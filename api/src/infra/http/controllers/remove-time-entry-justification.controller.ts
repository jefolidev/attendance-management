import type { RemoveTimeEntryJustificationUseCase } from '@src/domain/manage/application/use-cases/admin/remove-time-entry-justification'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { removeTimeEntryJustificationParamsSchema } from './time-entry-justification.schemas'
import { sendAdminError } from './admin-error-response'

export class RemoveTimeEntryJustificationController {
	constructor(private readonly useCase: RemoveTimeEntryJustificationUseCase) {}

	async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
		try {
			const params = removeTimeEntryJustificationParamsSchema.parse(request.params)
			const result = await this.useCase.execute({
				requesterId: request.auth!.id,
				...params,
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
