import { type Either, left, right } from '@src/core/either'
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

dayjs.extend(utc)
dayjs.extend(timezone)

interface GetAccumulatedDelayTimeUseCaseRequest {
	requesterId: string
	page?: number
	perPage?: number
	sort?: 'asc' | 'desc'
}

export interface DelayDay {
	date: Date
	clockIn: Date
	clockOut: Date
	expectedTime: string
	lateMinutes: number
	reason: 'LATE_ARRIVAL'
	compensations: Array<{
		durationInMinutes: number
		reason: 'COMPENSATION'
	}>
}

export interface DelayPagination extends PaginationMeta {
	totalPages: number
}

type GetAccumulatedDelayTimeUseCaseResponse = Either<
	NotFoundError,
	{
		totalLateMinutes: number
		compensatedMinutes: number
		uncompensatedMinutes: number
		days: DelayDay[]
		pagination: DelayPagination
	}
>

export class GetAccumulatedDelayTimeUseCase {
	constructor(
		private readonly employeeRepository: EmployeeRepository,
		private readonly workScheduleRepository: WorkScheduleRepository,
		private readonly timeEntryRepository: TimeEntryRepository,
	) {}

	async execute(
		request: GetAccumulatedDelayTimeUseCaseRequest,
	): Promise<GetAccumulatedDelayTimeUseCaseResponse> {
		const employee = await this.employeeRepository.findById(request.requesterId)

		if (!employee) {
			return left(new NotFoundError('Employee not found'))
		}

		const workSchedule = await this.workScheduleRepository.findByEmployeeId(
			employee.id.toString(),
		)

		if (!workSchedule) {
			return left(new NotFoundError('Work schedule not found'))
		}

		const timeEntries = await this.timeEntryRepository.findByEmployeeId(
			employee.id.toString(),
		)

		if (!timeEntries || timeEntries.length === 0) {
			const pagination = normalizePagination({
				page: request.page,
				perPage: request.perPage ?? 10,
				sort: request.sort,
			})

			return right({
				compensatedMinutes: 0,
				totalLateMinutes: 0,
				uncompensatedMinutes: 0,
				days: [],
			pagination: { ...pagination, hasNextPage: false, totalPages: 1 },
			})
		}

		const completedTimeEntries =
			await this.timeEntryRepository.findCompletedByEmployeeId(
				employee.id.toString(),
			)

		let compensatedMinutes = 0
		let uncompensatedMinutes = 0
		let totalLateMinutes = 0
		const delayDays: DelayDay[] = []

		const outstandingDelayDays: DelayDay[] = []
		for (const entry of [...completedTimeEntries].sort(
			(first, second) => first.clockIn.getTime() - second.clockIn.getTime(),
		)) {
			if (!entry.clockOut) continue

			const clockIn = dayjs(entry.clockIn).tz(WORK_SCHEDULE_TIMEZONE)
			const clockOut = dayjs(entry.clockOut).tz(WORK_SCHEDULE_TIMEZONE)
			const dailySchedule = workSchedule.getDailySchedule(entry.clockIn)

			if (!dailySchedule) continue

			const expectedStart = dayjs(workSchedule.startTimeToDate(entry.clockIn)).tz(
				WORK_SCHEDULE_TIMEZONE,
			)
			const expectedEnd = dayjs(workSchedule.endTimeToDate(entry.clockOut)).tz(
				WORK_SCHEDULE_TIMEZONE,
			)

			const lateMinutes = workSchedule.isLateWithTolerance(entry.clockIn)
				? Math.max(0, clockIn.diff(expectedStart, 'minute'))
				: 0
			const extraMinutes = Math.max(0, clockOut.diff(expectedEnd, 'minute'))

			totalLateMinutes += lateMinutes

			if (lateMinutes > 0) {
				const delayDay: DelayDay = {
					date: clockIn.toDate(),
					clockIn: clockIn.toDate(),
					clockOut: clockOut.toDate(),
					expectedTime: dailySchedule.startTime,
					lateMinutes,
					reason: 'LATE_ARRIVAL',
					compensations: [],
				}
				delayDays.push(delayDay)
				outstandingDelayDays.push(delayDay)
			}

			let remainingExtraMinutes = extraMinutes
			while (remainingExtraMinutes > 0 && outstandingDelayDays.length > 0) {
				const outstandingDay = outstandingDelayDays[0]!
				const dayOutstandingMinutes = outstandingDay.lateMinutes -
					outstandingDay.compensations.reduce(
						(total, compensation) => total + compensation.durationInMinutes,
						0,
					)
				const appliedMinutes = Math.min(remainingExtraMinutes, dayOutstandingMinutes)
				outstandingDay.compensations.push({
					durationInMinutes: appliedMinutes,
					reason: 'COMPENSATION',
				})
				remainingExtraMinutes -= appliedMinutes
				compensatedMinutes += appliedMinutes
				if (appliedMinutes === dayOutstandingMinutes) outstandingDelayDays.shift()
			}
		}
		uncompensatedMinutes = totalLateMinutes - compensatedMinutes

		const pagination = normalizePagination({
			page: request.page,
			perPage: request.perPage ?? 10,
			sort: request.sort,
		})
		delayDays.sort((first, second) => {
			const firstTime = first.date.getTime()
			const secondTime = second.date.getTime()
			return pagination.sort === 'asc' ? firstTime - secondTime : secondTime - firstTime
		})
		const start = (pagination.page - 1) * pagination.perPage
		const days = delayDays.slice(start, start + pagination.perPage)

		return right({
			compensatedMinutes,
			totalLateMinutes,
			uncompensatedMinutes,
			days,
			pagination: {
				...pagination,
				hasNextPage: delayDays.length > start + days.length,
				totalPages: Math.max(1, Math.ceil(delayDays.length / pagination.perPage)),
			},
		})
	}

}
