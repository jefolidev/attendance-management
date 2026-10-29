import { type Either, left, right } from '@src/core/either';
import { BadRequestError } from '@src/core/entities/errors/bad-request-error';
import { NotFoundError } from '@src/core/entities/errors/not-found-error';
import type { EmployeeRepository } from '../repositories/employee.repository';
import type { TimeEntryRepository } from '../repositories/time-entry.repository';
import type { WorkScheduleRepository } from '../repositories/work-schedule.repository';

interface RegisterBreakEntryUseCaseRequest {
	breakIn: Date
	requesterId: string
}

type RegisterBreakEntryUseCaseResponse = Either<
	BadRequestError | NotFoundError,
	{ timeEntryId: string }
>

export class RegisterBreakEntryUseCase {
	constructor(
		private readonly timeEntryRepository: TimeEntryRepository,
		private readonly employeeRepository: EmployeeRepository,
		private readonly workScheduleRepository: WorkScheduleRepository,
	) {}

	async execute(
		request: RegisterBreakEntryUseCaseRequest,
	): Promise<RegisterBreakEntryUseCaseResponse> {
		const { breakIn, requesterId } = request

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

		const existingTimeEntryInBreak =
			await this.timeEntryRepository.findInProgressByEmployeeId(requesterId)

		if (!existingTimeEntryInBreak) {
			return left(
				new NotFoundError(
					'No active time entry found for this employee to break out.',
				),
			)
		}

		const existingBreak = existingTimeEntryInBreak?.haveAnActiveBreak()

		if (existingBreak) {
			existingTimeEntryInBreak.endBreak(breakIn)
			await this.timeEntryRepository.update(existingTimeEntryInBreak)

			return right({ timeEntryId: existingTimeEntryInBreak.id.toString() })
		}

		if (!existingTimeEntryInBreak.isClockedIn()) {
			return left(
				new NotFoundError(
					'No active time entry found for this employee to break out.',
				),
			)
		}

		const usedBreaks = existingTimeEntryInBreak.breaks.length
		const allowedBreaks = workSchedule.breaksPerDay

		if (usedBreaks >= allowedBreaks) {
			return left(
				new BadRequestError(
					'Maximum number of breaks reached for this employee.',
				),
			)
		}

		existingTimeEntryInBreak.startBreak(breakIn)
		await this.timeEntryRepository.update(existingTimeEntryInBreak)

		return right({ timeEntryId: existingTimeEntryInBreak.id.toString() })
	}
}
