import { left, right, type Either } from '@src/core/either'
import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import type { EmployeeRepository } from '../../repositories/employee.repository'
import type { TimeEntryRepository } from '../../repositories/time-entry.repository'
import type { WorkScheduleRepository } from '../../repositories/work-schedule.repository'
import type { EntriesAndStatisticsProps } from '../value-objects/entries-and-statistics'
import { ListEmployeeEntriesUseCase } from '../list-employee-entries'
import { ensureAdminAndTarget } from './ensure-admin'

interface GetEmployeeEntriesUseCaseRequest {
	requesterId: string
	employeeId: string
}

type GetEmployeeEntriesUseCaseResponse = Either<
	NotAllowedError | NotFoundError | BadRequestError,
	{ entries: Record<string, EntriesAndStatisticsProps>[] }
>

export class GetEmployeeEntriesUseCase {
	private readonly listEmployeeEntriesUseCase: ListEmployeeEntriesUseCase

	constructor(
		private readonly employeeRepository: EmployeeRepository,
		workScheduleRepository: WorkScheduleRepository,
		timeEntryRepository: TimeEntryRepository,
	) {
		this.listEmployeeEntriesUseCase = new ListEmployeeEntriesUseCase(
			employeeRepository,
			workScheduleRepository,
			timeEntryRepository,
		)
	}

	async execute({
		requesterId,
		employeeId,
	}: GetEmployeeEntriesUseCaseRequest): Promise<GetEmployeeEntriesUseCaseResponse> {
		const authorization = await ensureAdminAndTarget(
			this.employeeRepository,
			requesterId,
			employeeId,
		)

		if (authorization.isLeft()) {
			return left(authorization.value)
		}

		const result = await this.listEmployeeEntriesUseCase.execute({
			requesterId: authorization.value.id.toString(),
		})

		if (result.isLeft()) {
			return left(new NotFoundError('Employee entries not found'))
		}

		return right(result.value)
	}
}
