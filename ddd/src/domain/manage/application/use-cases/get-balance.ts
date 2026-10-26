import { Either, left, right } from '@src/core/either'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import { TimeBalance } from '../../enterprise/entities/time-balance'
import { EmployeeRepository } from '../repositories/employee.repository'
import { TimeBalanceRepository } from '../repositories/time-balance.repository'

interface GetBalanceUseCaseRequest {
	requesterId: string
}

type GetBalanceUseCaseResponse = Either<
	NotFoundError,
	{
		balance: TimeBalance
	}
>

export class GetBalanceUseCase {
	constructor(
		private readonly employeeRepository: EmployeeRepository,
		private readonly timeBalanceRepository: TimeBalanceRepository,
	) {}

	async execute(
		request: GetBalanceUseCaseRequest,
	): Promise<GetBalanceUseCaseResponse> {
		const { requesterId } = request

		if (!requesterId) {
			return left(new NotFoundError('Requester ID is required'))
		}

		const balance =
			await this.timeBalanceRepository.findByEmployeeId(requesterId)

		if (!balance) {
			return left(new NotFoundError('Balance not found for this employee'))
		}

		return right({ balance })
	}
}
