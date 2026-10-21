import { type Either, left, right } from '@src/core/either'
import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import { TimeEntry, TimeEntryStage } from '../../enterprise/entities/time-entry'
import type { EmployeeRepository } from '../repositories/employee.repository'
import type { TimeEntryRepository } from '../repositories/time-entry.repository'
import type { WorkScheduleRepository } from '../repositories/work-schedule.repository'

interface RegisterTimeInEntryUseCaseRequest {
	clockIn: Date
	requesterId: string
}

type RegisterTimeInEntryUseCaseResponse = Either<
	BadRequestError | NotFoundError,
	{ timeEntryId: string }
>

export class RegisterTimeInEntryUseCase {
	constructor(
		private readonly timeEntryRepository: TimeEntryRepository,
		private readonly employeeRepository: EmployeeRepository,
		private readonly workScheduleRepository: WorkScheduleRepository,
	) {}

	async execute(
		request: RegisterTimeInEntryUseCaseRequest,
	): Promise<RegisterTimeInEntryUseCaseResponse> {
		const { clockIn, requesterId } = request

		const requester = await this.employeeRepository.findById(requesterId)

		if (!requester) {
			return left(new NotFoundError('Requester not found'))
		}

		const workSchedule =
			await this.workScheduleRepository.findByEmployeeId(requesterId)

		if (!workSchedule) {
			return left(
				new NotFoundError('Work schedule not found for this employee'),
			)
		}

		const existingTimeEntry =
			await this.timeEntryRepository.findByEmployeeId(requesterId)

		const existingTimeEntryForToday = existingTimeEntry?.some((entry) =>
			entry.haveAnActiveEntry(),
		)

		if (existingTimeEntryForToday) {
			return left(new BadRequestError('Already have an active time entry.'))
		}

		const timeEntry = TimeEntry.create({
			clockIn,
			status: TimeEntryStage.CLOCKED_IN,
			employeeId: requester.id,
		})

		await this.timeEntryRepository.create(timeEntry)

		return right({ timeEntryId: timeEntry.id.toString() })
	}
}
