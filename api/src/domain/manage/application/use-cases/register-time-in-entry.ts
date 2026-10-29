import { type Either, left, right } from '@src/core/either'
import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import { UniqueEntityId } from '@src/core/entities/unique-entity-id'
import { WORK_SCHEDULE_TIMEZONE } from '@src/core/time/work-schedule-timezone'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { TimeBalance } from '../../enterprise/entities/time-balance'
import { TimeEntry, TimeEntryStage } from '../../enterprise/entities/time-entry'
import type { EmployeeRepository } from '../repositories/employee.repository'
import type { TimeBalanceEntryRepository } from '../repositories/time-balance-entry.repository'
import type { TimeBalanceRepository } from '../repositories/time-balance.repository'
import type { TimeEntryRepository } from '../repositories/time-entry.repository'
import type { WorkScheduleRepository } from '../repositories/work-schedule.repository'

dayjs.extend(utc)
dayjs.extend(timezone)

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

		const clockInAt = dayjs(clockIn).tz(WORK_SCHEDULE_TIMEZONE)
		const startTime = dayjs(
			workSchedule.startTimeToDate(clockIn),
		).tz(WORK_SCHEDULE_TIMEZONE)

		let timeEntryCreated = false

		try {
			await this.timeEntryRepository.create(timeEntry)
			timeEntryCreated = true

			if (workSchedule.isLateWithTolerance(clockIn)) {
				const minutesLate = clockInAt.diff(startTime, 'minute')

				await this.ensureTimeBalance(requesterId)
				await this.timeBalanceEntryRepository.addDebitEntry(
					requesterId,
					minutesLate,
					'LATE_ARRIVAL',
				)
			} else if (workSchedule.isEarly(clockIn)) {
				const minutesEarly = startTime.diff(clockInAt, 'minute')
				await this.creditExtraTime(requesterId, minutesEarly)
			}
		} catch (error) {
			if (timeEntryCreated) {
				await this.timeEntryRepository.delete(timeEntry.id.toString())
			}

			throw error
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
