import { left, right, type Either } from '@src/core/either'
import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import type { EmployeeRepository } from '../../repositories/employee.repository'
import type { TimeBalanceEntryRepository } from '../../repositories/time-balance-entry.repository'
import type { TimeBalanceRepository } from '../../repositories/time-balance.repository'
import type { TimeEntryRepository } from '../../repositories/time-entry.repository'
import type { WorkScheduleRepository } from '../../repositories/work-schedule.repository'
import { RecalculateEmployeeTimeBalanceUseCase } from './recalculate-employee-time-balance'
import { ensureAdminAndTarget } from './ensure-admin'

interface UpdateEmployeeTimeEntryUseCaseRequest {
	requesterId: string
	employeeId: string
	timeEntryId: string
	clockIn?: Date
	clockOut?: Date
}

type UpdateEmployeeTimeEntryUseCaseResponse = Either<
	BadRequestError | NotAllowedError | NotFoundError,
	void
>

export class UpdateEmployeeTimeEntryUseCase {
	private readonly recalculateEmployeeTimeBalance?: RecalculateEmployeeTimeBalanceUseCase

	constructor(
		private readonly employeeRepository: EmployeeRepository,
		private readonly timeEntryRepository: TimeEntryRepository,
		workScheduleRepository?: WorkScheduleRepository,
		timeBalanceRepository?: TimeBalanceRepository,
		timeBalanceEntryRepository?: TimeBalanceEntryRepository,
	) {
		if (workScheduleRepository && timeBalanceRepository && timeBalanceEntryRepository) {
			this.recalculateEmployeeTimeBalance = new RecalculateEmployeeTimeBalanceUseCase(
				employeeRepository,
				workScheduleRepository,
				timeEntryRepository,
				timeBalanceRepository,
				timeBalanceEntryRepository,
			)
		}
	}

	async execute({
		requesterId,
		employeeId,
		timeEntryId,
		clockIn,
		clockOut,
	}: UpdateEmployeeTimeEntryUseCaseRequest): Promise<UpdateEmployeeTimeEntryUseCaseResponse> {
		if (clockIn === undefined && clockOut === undefined) {
			return left(new BadRequestError('At least one time must be provided'))
		}

		const authorization = await ensureAdminAndTarget(
			this.employeeRepository,
			requesterId,
			employeeId,
		)

		if (authorization.isLeft()) return left(authorization.value)

		const timeEntry = await this.timeEntryRepository.findById(timeEntryId)

		if (!timeEntry || timeEntry.employeeId.toString() !== employeeId) {
			return left(new NotFoundError('Time entry not found'))
		}

		const nextClockIn = clockIn ?? timeEntry.clockIn
		const nextClockOut = clockOut ?? timeEntry.clockOut

		if (nextClockOut && nextClockOut < nextClockIn) {
			return left(
				new BadRequestError('Clock-out time cannot be earlier than clock-in time'),
			)
		}

		if (clockIn !== undefined) timeEntry.clockIn = clockIn
		if (clockOut !== undefined) timeEntry.clockOut = clockOut

		await this.timeEntryRepository.update(timeEntry)
		await this.recalculateEmployeeTimeBalance?.execute({ employeeId })

		return right(undefined)
	}
}
