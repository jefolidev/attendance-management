import { type Either, left, right } from '@src/core/either'
import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import { TimeEntryStage } from '../../enterprise/entities/time-entry'
import type { EmployeeRepository } from '../repositories/employee.repository'
import type { TimeEntryRepository } from '../repositories/time-entry.repository'
import type { WorkScheduleRepository } from '../repositories/work-schedule.repository'

interface RegisterTimeOutEntryUseCaseRequest {
	clockOut: Date
	requesterId: string
}

type RegisterTimeOutEntryUseCaseResponse = Either<
	BadRequestError | NotFoundError,
	{ timeEntryId: string }
>

export class RegisterTimeOutEntryUseCase {
	constructor(
		private readonly timeEntryRepository: TimeEntryRepository,
		private readonly employeeRepository: EmployeeRepository,
		private readonly workScheduleRepository: WorkScheduleRepository,
	) {}

	async execute(
		request: RegisterTimeOutEntryUseCaseRequest,
	): Promise<RegisterTimeOutEntryUseCaseResponse> {
		const { clockOut, requesterId } = request

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
			await this.timeEntryRepository.findInProgressByEmployeeId(requesterId)

		const existingTimeEntryForToday =
			existingTimeEntry?.isClockedIn &&
			existingTimeEntry.clockIn.toDateString() === clockOut.toDateString()

		if (!existingTimeEntryForToday) {
			return left(new BadRequestError('No active time entry found.'))
		}

		if (existingTimeEntry.status === TimeEntryStage.CLOCKED_OUT) {
			return left(new BadRequestError('Time entry is already clocked out.'))
		}

		if (clockOut < existingTimeEntry.clockIn) {
			return left(
				new BadRequestError(
					'Clock-out time cannot be earlier than clock-in time.',
				),
			)
		}

		if (clockOut > new Date()) {
			return left(
				new BadRequestError('Clock-out time cannot be in the future.'),
			)
		}

		existingTimeEntry.clockOut = clockOut

		await this.timeEntryRepository.update(existingTimeEntry)

		return right({ timeEntryId: existingTimeEntry.id.toString() })
	}
}
