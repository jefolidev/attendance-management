import { Either, left, right } from '@src/core/either'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import { TimeBalance } from '../../enterprise/entities/time-balance'
import { EmployeeRepository } from '../repositories/employee.repository'
import { TimeBalanceRepository } from '../repositories/time-balance.repository'

interface GetBalanceEventsUseCaseRequest {
	requesterId: string
}

type GetBalanceEventsUseCaseResponse = Either<
	NotFoundError,
	{ events: TimeBalance['events'] }
>

export class GetBalanceEventsUseCase {
	constructor(
		private readonly employeeRepository: EmployeeRepository,
		private readonly timeBalanceRepository: TimeBalanceRepository,
	) {}

	async execute(
		request: GetBalanceEventsUseCaseRequest,
	): Promise<GetBalanceEventsUseCaseResponse> {
		const employee = await this.employeeRepository.findById(request.requesterId)

		if (!employee) {
			return left(new NotFoundError('Employee not found'))
		}

		const timeBalance = await this.timeBalanceRepository.findByEmployeeId(
			employee.id.toString(),
		)

		if (!timeBalance) {
			return left(new NotFoundError('Time balance not found'))
		}

		return right({
			events: timeBalance.events,
		})
	}
}
