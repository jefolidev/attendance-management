import { type Either, left, right } from '@src/core/either'
import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import { UniqueEntityId } from '@src/core/entities/unique-entity-id'
import { WORK_SCHEDULE_TIMEZONE } from '@src/core/time/work-schedule-timezone'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { TimeBalance } from '../../enterprise/entities/time-balance'
import type { EmployeeRepository } from '../repositories/employee.repository'
import { TimeBalanceEntryRepository } from '../repositories/time-balance-entry.repository'
import { TimeBalanceRepository } from '../repositories/time-balance.repository'
import type { TimeEntryRepository } from '../repositories/time-entry.repository'
import type { WorkScheduleRepository } from '../repositories/work-schedule.repository'
import { calculateAutomaticTimeEntryBalance } from '../services/calculate-automatic-time-entry-balance'

dayjs.extend(utc)
dayjs.extend(timezone)

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

		if (!workSchedule.getDailySchedule(clockOut)) {
			return left(new BadRequestError('No work schedule configured for this day.'))
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
			dayjs(existingTimeEntry.clockIn)
				.tz(WORK_SCHEDULE_TIMEZONE)
				.isSame(dayjs(clockOut).tz(WORK_SCHEDULE_TIMEZONE), 'day')

		if (!existingTimeEntryForToday) {
			return left(new BadRequestError('No active time entry found.'))
		}

		if (
			dayjs(clockOut)
				.tz(WORK_SCHEDULE_TIMEZONE)
				.isBefore(dayjs(existingTimeEntry.clockIn).tz(WORK_SCHEDULE_TIMEZONE))
		) {
			return left(
				new BadRequestError(
					'Clock-out time cannot be earlier than clock-in time.',
				),
			)
		}

		if (
			dayjs(clockOut)
				.tz(WORK_SCHEDULE_TIMEZONE)
				.isAfter(dayjs().tz(WORK_SCHEDULE_TIMEZONE))
		) {
			return left(
				new BadRequestError('Clock-out time cannot be in the future.'),
			)
		}

		existingTimeEntry.clockOut = clockOut
		const existingBalance = await this.timeBalanceRepository.findByEmployeeId(
			requesterId,
		)
		const automaticEntries = calculateAutomaticTimeEntryBalance(
			existingTimeEntry,
			workSchedule,
			existingBalance?.balanceMinutes ?? 0,
			{ includeClockIn: false },
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

}
