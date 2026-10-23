import { type Either, left, right } from '@src/core/either'
import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import { UniqueEntityId } from '@src/core/entities/unique-entity-id'
import dayjs from 'dayjs'
import { TimeBalance } from '../../enterprise/entities/time-balance'
import type { EmployeeRepository } from '../repositories/employee.repository'
import { TimeBalanceEntryRepository } from '../repositories/time-balance-entry.repository'
import { TimeBalanceRepository } from '../repositories/time-balance.repository'
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
		private readonly employeeRepository: EmployeeRepository,
		private readonly workScheduleRepository: WorkScheduleRepository,

		private readonly timeEntryRepository: TimeEntryRepository,
		private readonly timeBalanceRepository: TimeBalanceRepository,
		private readonly timeBalanceEntryRepository: TimeBalanceEntryRepository,
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

		if (existingTimeEntry?.isOnBreak()) {
			return left(
				new BadRequestError('End the active break before clocking out.'),
			)
		}

		if (!existingTimeEntry) {
			return left(new BadRequestError('No active time entry found.'))
		}

		const existingTimeEntryForToday =
			existingTimeEntry?.isClockedIn() &&
			existingTimeEntry.clockIn.toDateString() === clockOut.toDateString()

		if (!existingTimeEntryForToday) {
			return left(new BadRequestError('No active time entry found.'))
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

		const endTime = workSchedule.endTimeToDate()

		if (workSchedule.isDepartedEarly(clockOut)) {
			await this.ensureTimeBalance(requesterId)
			await this.timeBalanceEntryRepository.addDebitEntry(
				requesterId,
				dayjs(endTime).diff(clockOut, 'minute'),
				'EARLY_DEPARTURE',
			)
		} else if (workSchedule.isDepartedLate(clockOut)) {
			await this.creditExtraTime(
				requesterId,
				dayjs(clockOut).diff(endTime, 'minute'),
			)
		}

		existingTimeEntry.clockOut = clockOut
		await this.timeEntryRepository.update(existingTimeEntry)

		return right({ timeEntryId: existingTimeEntry.id.toString() })
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

	private async creditExtraTime(
		employeeId: string,
		minutes: number,
	): Promise<void> {
		if (minutes <= 0) return

		const timeBalance = await this.ensureTimeBalance(employeeId)
		const hasDebt = timeBalance.balanceMinutes < 0

		await this.timeBalanceEntryRepository.addCreditEntry(
			employeeId,
			minutes,
			hasDebt ? 'COMPENSATION' : 'EXTRA',
		)
	}
}
