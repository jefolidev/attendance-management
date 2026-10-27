import { type Either, left, right } from '@src/core/either'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import dayjs from 'dayjs'
import type { EmployeeRepository } from '../repositories/employee.repository'
import type { TimeEntryRepository } from '../repositories/time-entry.repository'
import type { WorkScheduleRepository } from '../repositories/work-schedule.repository'

interface GetAccumulatedDelayTimeUseCaseRequest {
	requesterId: string
}

type GetAccumulatedDelayTimeUseCaseResponse = Either<
	NotFoundError,
	{
		totalLateMinutes: number
		compensatedMinutes: number
		uncompensatedMinutes: number
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
			return right({
				compensatedMinutes: 0,
				totalLateMinutes: 0,
				uncompensatedMinutes: 0,
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
		let uncompensatedMinutes = 0
		let totalLateMinutes = 0

		for (const entry of completedTimeEntries) {
			const clockIn = dayjs(entry.clockIn)
			const clockOut = dayjs(entry.clockOut)
			const day = clockIn.startOf('day')

			const expectedStart = day
				.add(startHour, 'hour')
				.add(startMinute, 'minute')
			const expectedEnd = day.add(endHour, 'hour').add(endMinute, 'minute')

			const lateMinutes = Math.max(0, clockIn.diff(expectedStart, 'minute'))
			const extraMinutes = Math.max(0, clockOut.diff(expectedEnd, 'minute'))

			totalLateMinutes += lateMinutes
			compensatedMinutes += Math.min(lateMinutes, extraMinutes)
			uncompensatedMinutes = Math.max(
				0,
				uncompensatedMinutes + lateMinutes - extraMinutes,
			)
		}

		return right({
			compensatedMinutes,
			totalLateMinutes,
			uncompensatedMinutes,
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
