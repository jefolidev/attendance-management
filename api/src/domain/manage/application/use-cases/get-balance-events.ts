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
import type { TimeEntryRepository } from '../repositories/time-entry.repository'

interface GetBalanceEventsUseCaseRequest {
	requesterId: string
	page?: number
	perPage?: number
	sort?: 'asc' | 'desc'
}

type GetBalanceEventsUseCaseResponse = Either<
	NotFoundError,
	{
		events: Array<TimeBalance['events'][number] & { clockType: 'CLOCK_IN' | 'CLOCK_OUT' | 'OTHER' }>
		pagination: PaginationMeta
	}
>

export class GetBalanceEventsUseCase {
	constructor(
		private readonly employeeRepository: EmployeeRepository,
		private readonly timeBalanceRepository: TimeBalanceRepository,
		private readonly timeEntryRepository?: TimeEntryRepository,
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
		const sortedEvents = [...timeBalance.events].sort((first, second) => {
			const firstTime = first.createdAt.getTime()
			const secondTime = second.createdAt.getTime()
			return pagination.sort === 'asc' ? firstTime - secondTime : secondTime - firstTime
		})
		const pageEvents = sortedEvents.slice(
			start,
			start + pagination.perPage,
		)
		const events = await Promise.all(pageEvents.map(async (event) => {
			const timeEntry = event.timeEntryId && this.timeEntryRepository
				? await this.timeEntryRepository.findById(event.timeEntryId.toString())
				: null
			const clockType = timeEntry && event.createdAt.getTime() === timeEntry.clockIn.getTime()
				? 'CLOCK_IN'
				: timeEntry?.clockOut && event.createdAt.getTime() === timeEntry.clockOut.getTime()
					? 'CLOCK_OUT'
					: event.reason === 'LATE_ARRIVAL'
						? 'CLOCK_IN'
						: event.reason === 'EARLY_DEPARTURE' ||
							event.reason === 'OVERTIME' ||
							event.reason === 'COMPENSATION' ||
							event.reason === 'EXTRA'
							? 'CLOCK_OUT'
							: 'OTHER'
			return { ...event, clockType } as const
		}))

		return right({
			events,
			pagination: {
				...pagination,
				hasNextPage: sortedEvents.length > start + events.length,
			},
		})
	}
}
