import { type Either, left, right } from '@src/core/either'
import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import { UniqueEntityId } from '@src/core/entities/unique-entity-id'
import { TimeBalance } from '../../enterprise/entities/time-balance'
import { TimeEntry, TimeEntryStage } from '../../enterprise/entities/time-entry'
import type { EmployeeRepository } from '../repositories/employee.repository'
import type { TimeBalanceEntryRepository } from '../repositories/time-balance-entry.repository'
import type { TimeBalanceRepository } from '../repositories/time-balance.repository'
import type { TimeEntryRepository } from '../repositories/time-entry.repository'
import type { WorkScheduleRepository } from '../repositories/work-schedule.repository'
import { calculateAutomaticTimeEntryBalance } from '../services/calculate-automatic-time-entry-balance'

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
		private readonly employeeRepository: EmployeeRepository,
		private readonly workScheduleRepository: WorkScheduleRepository,

		private readonly timeEntryRepository: TimeEntryRepository,
		private readonly timeBalanceRepository: TimeBalanceRepository,
		private readonly timeBalanceEntryRepository: TimeBalanceEntryRepository,
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

		if (!workSchedule.getDailySchedule(clockIn)) {
			return left(new BadRequestError('No work schedule configured for this day.'))
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

		const existingBalance = await this.timeBalanceRepository.findByEmployeeId(
			requesterId,
		)
		const automaticEntries = calculateAutomaticTimeEntryBalance(
			timeEntry,
			workSchedule,
			existingBalance?.balanceMinutes ?? 0,
			{ includeClockOut: false },
		)
		if (automaticEntries.length > 0) {
			await this.ensureTimeBalance(requesterId)
			for (const entry of automaticEntries) {
				if (entry.type === 'CREDIT') {
					await this.timeBalanceEntryRepository.addCreditEntry(
						requesterId,
						entry.durationInMinutes,
						entry.reason,
					)
				} else {
					await this.timeBalanceEntryRepository.addDebitEntry(
						requesterId,
						entry.durationInMinutes,
						entry.reason,
					)
				}
			}
		}

		return right({ timeEntryId: timeEntry.id.toString() })
	}

	private async ensureTimeBalance(employeeId: string): Promise<TimeBalance> {
		const existing =
			await this.timeBalanceRepository.findByEmployeeId(employeeId)

		if (existing) return existing

		const created = TimeBalance.create({
			employeeId: new UniqueEntityId(employeeId),
		})

		await this.timeBalanceRepository.create(created)

		return created
	}

}
