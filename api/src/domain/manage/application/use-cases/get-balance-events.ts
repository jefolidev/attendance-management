import { left, right } from '@src/core/either'
import type { Either } from '@src/core/either'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import {
	normalizePagination,
	type PaginationMeta,
} from '@src/core/repositories/pagination'
import { TimeBalance } from '../../enterprise/entities/time-balance'
import { EmployeeRepository } from '../repositories/employee.repository'
import { TimeBalanceRepository } from '../repositories/time-balance.repository'

interface GetBalanceEventsUseCaseRequest {
	requesterId: string
	page?: number
	perPage?: number
}

type GetBalanceEventsUseCaseResponse = Either<
	NotFoundError,
	{ events: TimeBalance['events']; pagination: PaginationMeta }
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

		const pagination = normalizePagination(request)
		const start = (pagination.page - 1) * pagination.perPage
		const events = timeBalance.events.slice(
			start,
			start + pagination.perPage,
		)

		return right({
			events,
			pagination: {
				...pagination,
				hasNextPage: timeBalance.events.length > start + events.length,
			},
		})
	}
}
