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
			})

			return right({
				compensatedMinutes: 0,
				totalLateMinutes: 0,
				uncompensatedMinutes: 0,
				days: [],
			pagination: { ...pagination, hasNextPage: false, totalPages: 1 },
			})
		}

		const { hours: startHour, minutes: startMinute } = this.parseTimeString(
			workSchedule.startTime,
		)
		const { hours: endHour, minutes: endMinute } = this.parseTimeString(
			workSchedule.endTime,
		)

		const completedTimeEntries =
			await this.timeEntryRepository.findCompletedByEmployeeId(
				employee.id.toString(),
			)

		let compensatedMinutes = 0
		let totalLateMinutes = 0
		const delayDays: DelayDay[] = []

		for (const entry of completedTimeEntries) {
			if (!entry.clockOut) continue

			const clockIn = dayjs(entry.clockIn).tz(WORK_SCHEDULE_TIMEZONE)
			const clockOut = dayjs(entry.clockOut).tz(WORK_SCHEDULE_TIMEZONE)
			const day = clockIn.startOf('day')

			const expectedStart = day
				.add(startHour, 'hour')
				.add(startMinute, 'minute')
			const expectedEnd = day.add(endHour, 'hour').add(endMinute, 'minute')

			const lateMinutes = Math.max(0, clockIn.diff(expectedStart, 'minute'))
			const extraMinutes = Math.max(0, clockOut.diff(expectedEnd, 'minute'))

			totalLateMinutes += lateMinutes
			const dayCompensatedMinutes = Math.min(lateMinutes, extraMinutes)
			compensatedMinutes += dayCompensatedMinutes

			if (lateMinutes > 0) {
				delayDays.push({
					date: clockIn.toDate(),
					clockIn: clockIn.toDate(),
					clockOut: clockOut.toDate(),
					expectedTime: workSchedule.startTime,
					lateMinutes,
					reason: 'LATE_ARRIVAL',
					compensations:
						dayCompensatedMinutes > 0
							? [{ durationInMinutes: dayCompensatedMinutes, reason: 'COMPENSATION' }]
							: [],
				})
			}
		}

		const pagination = normalizePagination({
			page: request.page,
			perPage: request.perPage ?? 10,
		})
		const start = (pagination.page - 1) * pagination.perPage
		const days = delayDays.slice(start, start + pagination.perPage)

		return right({
			compensatedMinutes,
			totalLateMinutes,
			uncompensatedMinutes: Math.max(0, totalLateMinutes - compensatedMinutes),
			days,
			pagination: {
				...pagination,
				hasNextPage: delayDays.length > start + days.length,
				totalPages: Math.max(1, Math.ceil(delayDays.length / pagination.perPage)),
			},
		})
	}

	private parseTimeString(timeString: string): {
		hours: number
		minutes: number
	} {
		const [hours, minutes] = timeString.split(':').map(Number)

		if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
			throw new Error(`Invalid time format: ${timeString}`)
		}

		return { hours: hours || 0, minutes: minutes || 0 }
	}
}
