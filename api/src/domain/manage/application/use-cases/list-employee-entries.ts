import { type Either, left, right } from '@src/core/either'
import type { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import dayjs from 'dayjs'
import type { EmployeeRepository } from '../repositories/employee.repository'
import type { TimeEntryRepository } from '../repositories/time-entry.repository'
import type { WorkScheduleRepository } from '../repositories/work-schedule.repository'
import type { EntriesAndStatisticsProps } from './value-objects/entries-and-statistics'

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

				const getTimeFromString = (timeString: string) => {
					const [hours, minutes] = timeString.split(':').map(Number)
					const date = new Date()
					date.setHours(hours || 0, minutes || 0, 0, 0)
					return date
				}

				const workStartTime = dayjs(getTimeFromString(startTime))
				const workEndTime = dayjs(getTimeFromString(endTime))

				const arrivedTime = dayjs(entry.clockIn)
				const departedTime = dayjs(entry.clockOut)

				const entryMinutesEarly = dayjs(arrivedTime).isBefore(workStartTime)
					? workStartTime.diff(dayjs(arrivedTime), 'minute')
					: 0

				const entryMinutesLate = dayjs(arrivedTime).isAfter(workStartTime)
					? workStartTime.diff(arrivedTime, 'minute')
					: 0

				const departureMinutesEarly = departedTime?.isBefore(workEndTime)
					? departedTime.diff(workEndTime, 'minute')
					: 0

				const departureMinutesLate = departedTime?.isAfter(workEndTime)
					? departedTime.diff(workEndTime, 'minute')
					: 0

				const totalWorkedTime = entry.calculateWorkedTimeWithoutBreaks()

				const date = new Date(entry.clockIn)

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
				return { [date.toDateString()]: entriesAndStatistics }
			})

		return right({ entries: entriesAndStatistics })
	}
}
