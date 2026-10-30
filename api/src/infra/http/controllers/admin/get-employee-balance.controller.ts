import type { GetEmployeeBalanceUseCase } from '@src/domain/manage/application/use-cases/admin/get-employee-balance'
import type { TimeBalance } from '@src/domain/manage/enterprise/entities/time-balance'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { presentTimeBalanceEntry } from '../../presenters/time-balance-entry.presenter'
import { sendAdminError } from './admin-error-response'
import { employeeIdParamsSchema } from './update-employee-password.controller'

function serializeBalance(balance: TimeBalance) {
	return {
		id: balance.id.toString(),
		employeeId: balance.employeeId.toString(),
		balanceMinutes: balance.balanceMinutes,
		updatedAt: balance.updatedAt?.toISOString() ?? null,
		events: balance.events.map(presentTimeBalanceEntry),
	}
}

export class GetEmployeeBalanceController {
	constructor(private readonly useCase: GetEmployeeBalanceUseCase) {}

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

			reply.status(200).send({ balance: serializeBalance(result.value.balance) })
		} catch (error) {
			sendAdminError(error, reply)
		}
	}
}
