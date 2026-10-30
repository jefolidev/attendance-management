import { left, right, type Either } from '@src/core/either'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import type { TimeBalance } from '../../../enterprise/entities/time-balance'
import type { EmployeeRepository } from '../../repositories/employee.repository'
import type { TimeBalanceRepository } from '../../repositories/time-balance.repository'
import { GetBalanceUseCase } from '../get-balance'
import { ensureAdminAndTarget } from './ensure-admin'

interface GetEmployeeBalanceUseCaseRequest {
	requesterId: string
	employeeId: string
}

export class GetEmployeeBalanceUseCase {
	private readonly getBalanceUseCase: GetBalanceUseCase

	constructor(
		private readonly employeeRepository: EmployeeRepository,
		private readonly timeBalanceRepository: TimeBalanceRepository,
	) {
		this.getBalanceUseCase = new GetBalanceUseCase(
			employeeRepository,
			timeBalanceRepository,
		)
	}

	async execute({
		requesterId,
		employeeId,
	}: GetEmployeeBalanceUseCaseRequest): Promise<
		Either<NotAllowedError | NotFoundError, { balance: TimeBalance | null }>
	> {
		const authorization = await ensureAdminAndTarget(
			this.employeeRepository,
			requesterId,
			employeeId,
		)

		if (authorization.isLeft()) {
			return left(authorization.value)
		}

		const balance = await this.timeBalanceRepository.findByEmployeeId(employeeId)

		if (!balance) {
			return right({ balance: null })
		}

		const result = await this.getBalanceUseCase.execute({ requesterId: employeeId })

		if (result.isLeft()) {
			return left(result.value)
		}

		return right(result.value)
	}
}
