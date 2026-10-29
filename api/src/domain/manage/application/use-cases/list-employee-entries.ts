import { type Either, left, right } from '@src/core/either'
import type { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import { WORK_SCHEDULE_TIMEZONE } from '@src/core/time/work-schedule-timezone'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import type { EmployeeRepository } from '../repositories/employee.repository'
import type { TimeEntryRepository } from '../repositories/time-entry.repository'
import type { WorkScheduleRepository } from '../repositories/work-schedule.repository'
import type { EntriesAndStatisticsProps } from './value-objects/entries-and-statistics'

dayjs.extend(utc)
dayjs.extend(timezone)

interface ListEmployeeEntriesUseCaseRequest {
	requesterId: string
	page?: number
}

type ListEmployeeEntriesUseCaseResponse = Either<
	BadRequestError,
	{ entries: Record<string, EntriesAndStatisticsProps>[] }
>

export class ListEmployeeEntriesUseCase {
	constructor(
		private readonly employeeRepository: EmployeeRepository,
		private readonly workScheduleRepository: WorkScheduleRepository,
		private readonly timeEntryRepository: TimeEntryRepository,
	) {}

	async execute({
		requesterId,
	}: ListEmployeeEntriesUseCaseRequest): Promise<ListEmployeeEntriesUseCaseResponse> {
		if (!requesterId) {
			return left(new NotFoundError('Requester ID is required'))
		}

		const employee = await this.employeeRepository.findById(requesterId)

		if (!employee) {
			return left(new NotFoundError('Employee not found'))
		}

		const workSchedule =
			await this.workScheduleRepository.findByEmployeeId(requesterId)

		if (!workSchedule) {
			return left(
				new NotFoundError('Work schedule not found for the given requester ID'),
			)
		}

		const timeEntries =
			await this.timeEntryRepository.findByEmployeeId(requesterId)

		const entriesAndStatistics: Record<string, EntriesAndStatisticsProps>[] =
			timeEntries.map((entry) => {
				const { startTime, endTime } = workSchedule

				const getTimeFromString = (timeString: string, referenceDate: Date) => {
					const [hours, minutes] = timeString.split(':').map(Number)
					return dayjs(referenceDate)
						.tz(WORK_SCHEDULE_TIMEZONE)
						.startOf('day')
						.hour(hours || 0)
						.minute(minutes || 0)
						.second(0)
						.millisecond(0)
				}

				const workStartTime = getTimeFromString(startTime, entry.clockIn)
				const workEndTime = getTimeFromString(endTime, entry.clockIn)

				const arrivedTime = dayjs(entry.clockIn).tz(WORK_SCHEDULE_TIMEZONE)
				const departedTime = entry.clockOut
					? dayjs(entry.clockOut).tz(WORK_SCHEDULE_TIMEZONE)
					: null

				const entryMinutesEarly = dayjs(arrivedTime).isBefore(workStartTime)
					? arrivedTime.diff(workStartTime, 'minute')
					: 0

				const entryMinutesLate = dayjs(arrivedTime).isAfter(workStartTime)
					? arrivedTime.diff(workStartTime, 'minute')
					: 0

				const departureMinutesEarly = departedTime?.isBefore(workEndTime)
					? workEndTime.diff(departedTime, 'minute')
					: 0

				const departureMinutesLate = departedTime?.isAfter(workEndTime)
					? departedTime.diff(workEndTime, 'minute')
					: 0

				const totalWorkedTime = entry.calculateWorkedTimeWithoutBreaks()

				const localDate = dayjs(entry.clockIn).tz(WORK_SCHEDULE_TIMEZONE)
				const date = localDate.toDate()

				const entriesAndStatistics: EntriesAndStatisticsProps = {
					timeEntryStage: entry.status,
					occurredAt: date,
					entryMinutesEarly,
					entryMinutesLate,
					departureMinutesEarly,
					departureMinutesLate,
					totalWorkedMinutes:
						totalWorkedTime < 0 ? -1 : Math.floor(totalWorkedTime / 60000),
				}
				return { [localDate.format('ddd MMM DD YYYY')]: entriesAndStatistics }
			})

		return right({ entries: entriesAndStatistics })
	}
}
