import { left, right, type Either } from '@src/core/either'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import type { EmployeeRepository } from '../../repositories/employee.repository'
import type { TimeBalance } from '../../../enterprise/entities/time-balance'
import type { TimeBalanceRepository } from '../../repositories/time-balance.repository'
import { GetBalanceUseCase } from '../get-balance'
import { ensureAdminAndTarget } from './ensure-admin'

interface GetEmployeeBalanceUseCaseRequest {
	requesterId: string
	employeeId: string
}

type GetEmployeeBalanceUseCaseResponse = Either<
	NotAllowedError | NotFoundError,
	{ balance: TimeBalance }
>

export class GetEmployeeBalanceUseCase {
	private readonly getBalanceUseCase: GetBalanceUseCase

	constructor(
		private readonly employeeRepository: EmployeeRepository,
		timeBalanceRepository: TimeBalanceRepository,
	) {
		this.getBalanceUseCase = new GetBalanceUseCase(
			employeeRepository,
			timeBalanceRepository,
		)
	}

	async execute({
		requesterId,
		employeeId,
	}: GetEmployeeBalanceUseCaseRequest): Promise<GetEmployeeBalanceUseCaseResponse> {
		const authorization = await ensureAdminAndTarget(
			this.employeeRepository,
			requesterId,
			employeeId,
		)

		if (authorization.isLeft()) {
			return left(authorization.value)
		}

		const result = await this.getBalanceUseCase.execute({
			requesterId: authorization.value.id.toString(),
		})

		if (result.isLeft()) {
			return left(result.value)
		}

		return right(result.value)
	}
}
