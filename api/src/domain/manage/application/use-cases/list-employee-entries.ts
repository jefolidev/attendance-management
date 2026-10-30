import { type Either, left, right } from '@src/core/either'
import type { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import {
	normalizePagination,
	type PaginationMeta,
} from '@src/core/repositories/pagination'
import { WORK_SCHEDULE_TIMEZONE } from '@src/core/time/work-schedule-timezone'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import type { EmployeeRepository } from '../repositories/employee.repository'
import type { TimeEntryRepository } from '../repositories/time-entry.repository'
import type { WorkScheduleRepository } from '../repositories/work-schedule.repository'
import type { TimeEntryJustificationRepository } from '../repositories/time-entry-justification.repository'
import type { EntriesAndStatisticsProps } from './value-objects/entries-and-statistics'

dayjs.extend(utc)
dayjs.extend(timezone)

interface ListEmployeeEntriesUseCaseRequest {
	requesterId: string
	page?: number
	perPage?: number
	sort?: 'asc' | 'desc'
}

type ListEmployeeEntriesUseCaseResponse = Either<
	BadRequestError,
	{
		entries: Record<string, EntriesAndStatisticsProps>[]
		pagination: PaginationMeta
	}
>

export class ListEmployeeEntriesUseCase {
	constructor(
		private readonly employeeRepository: EmployeeRepository,
		private readonly workScheduleRepository: WorkScheduleRepository,
		private readonly timeEntryRepository: TimeEntryRepository,
		private readonly timeEntryJustificationRepository: TimeEntryJustificationRepository,
	) {}

	async execute({
		requesterId,
		page,
		perPage,
		sort,
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

		const pagination = normalizePagination({ page, perPage, sort })
		const timeEntries = await this.timeEntryRepository.findByEmployeeId(
			requesterId,
			pagination,
		)
		const entriesForPage = timeEntries.slice(0, pagination.perPage)
		const justifications = await this.timeEntryJustificationRepository.findByEmployeeId(requesterId)
		const justificationsByEntryId = new Map<string, typeof justifications>()
		for (const justification of justifications) {
			const entryJustifications = justificationsByEntryId.get(justification.timeEntryId.toString()) ?? []
			entryJustifications.push(justification)
			justificationsByEntryId.set(justification.timeEntryId.toString(), entryJustifications)
		}

		const entriesAndStatistics: Record<string, EntriesAndStatisticsProps>[] =
			entriesForPage.map((entry) => {

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

				const dailySchedule = workSchedule.getDailySchedule(entry.clockIn)
				const workStartTime = dailySchedule
					? getTimeFromString(dailySchedule.startTime, entry.clockIn)
					: null
				const workEndTime = dailySchedule
					? getTimeFromString(dailySchedule.endTime, entry.clockIn)
					: null

				const arrivedTime = dayjs(entry.clockIn).tz(WORK_SCHEDULE_TIMEZONE)
				const departedTime = entry.clockOut
					? dayjs(entry.clockOut).tz(WORK_SCHEDULE_TIMEZONE)
					: null

				const entryMinutesEarly = workStartTime && dayjs(arrivedTime).isBefore(workStartTime)
					? workStartTime.diff(arrivedTime, 'minute')
					: 0

				const entryMinutesLate = workStartTime && dayjs(arrivedTime).isAfter(workStartTime)
					? arrivedTime.diff(workStartTime, 'minute')
					: 0

				const departureMinutesEarly = workEndTime && departedTime?.isBefore(workEndTime)
					? workEndTime.diff(departedTime, 'minute')
					: 0

				const departureMinutesLate = workEndTime && departedTime?.isAfter(workEndTime)
					? departedTime.diff(workEndTime, 'minute')
					: 0

				const totalWorkedTime = entry.calculateWorkedTimeWithoutBreaks()
				const totalBreakTime = entry.breaks.reduce((total, breakEntry) => {
					if (!breakEntry.end) return total
					return total + breakEntry.end.getTime() - breakEntry.start.getTime()
				}, 0)

				const localDate = dayjs(entry.clockIn).tz(WORK_SCHEDULE_TIMEZONE)
				const date = localDate.toDate()

				const entriesAndStatistics: EntriesAndStatisticsProps = {
					timeEntryId: entry.id.toString(),
					timeEntryStage: entry.status,
					occurredAt: date,
					clockOut: entry.clockOut ?? null,
					breaks: entry.breaks,
					totalBreakMinutes: Math.floor(totalBreakTime / 60000),
					entryMinutesEarly,
					entryMinutesLate,
					departureMinutesEarly,
					departureMinutesLate,
					totalWorkedMinutes:
						totalWorkedTime < 0 ? -1 : Math.floor(totalWorkedTime / 60000),
					justifications: (justificationsByEntryId.get(entry.id.toString()) ?? []).map(
						(justification) => ({
							type: justification.type,
							category: justification.category,
							description: justification.description ?? undefined,
						}),
					),
				}
				return { [localDate.format('ddd MMM DD YYYY')]: entriesAndStatistics }
			})

		return right({
			entries: entriesAndStatistics,
			pagination: {
				...pagination,
				hasNextPage: timeEntries.length > pagination.perPage,
			},
		})
	}
}
