import { left, right, type Either } from '@src/core/either'
import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import type { EmployeeRepository } from '../../repositories/employee.repository'
import type { WorkScheduleRepository } from '../../repositories/work-schedule.repository'
import { ensureAdminAndTarget } from './ensure-admin'
import { isValidDays, validateDayOverrides, validateTime } from './employee-validation'
import type { WorkScheduleDayOverride } from '@src/domain/manage/enterprise/entities/work-schedule'

interface UpdateEmployeeWorkScheduleUseCaseRequest {
	requesterId: string
	employeeId: string
	startTime?: string
	endTime?: string
	breakStartTime?: string | null
	breakEndTime?: string | null
	lateTolerance?: number
	breaksPerDay?: number
	days?: number[]
	dayOverrides?: WorkScheduleDayOverride[]
}

export class UpdateEmployeeWorkScheduleUseCase {
	constructor(
		private readonly employeeRepository: EmployeeRepository,
		private readonly workScheduleRepository: WorkScheduleRepository,
	) {}

	async execute(
		request: UpdateEmployeeWorkScheduleUseCaseRequest,
	): Promise<
		Either<BadRequestError | NotAllowedError | NotFoundError, void>
	> {
		const fieldsProvided = [
			request.startTime,
			request.endTime,
			request.breakStartTime,
			request.breakEndTime,
			request.lateTolerance,
			request.breaksPerDay,
			request.days,
			request.dayOverrides,
		].some((field) => field !== undefined)

		if (!fieldsProvided) {
			return left(new BadRequestError('At least one field must be provided'))
		}

		const startTimeError = request.startTime
			? validateTime(request.startTime, 'Start time')
			: null
		const endTimeError = request.endTime
			? validateTime(request.endTime, 'End time')
			: null
		const breakStartTimeError = request.breakStartTime
			? validateTime(request.breakStartTime, 'Break start time')
			: null
		const breakEndTimeError = request.breakEndTime
			? validateTime(request.breakEndTime, 'Break end time')
			: null

		if (startTimeError || endTimeError || breakStartTimeError || breakEndTimeError) {
			return left(
				new BadRequestError(
					startTimeError ||
						endTimeError ||
						breakStartTimeError ||
						breakEndTimeError ||
						'Invalid time',
				),
			)
		}

		if (
			request.lateTolerance !== undefined &&
			(!Number.isInteger(request.lateTolerance) || request.lateTolerance < 0)
		) {
			return left(new BadRequestError('Late tolerance must be a non-negative integer'))
		}

		if (
			request.breaksPerDay !== undefined &&
			(!Number.isInteger(request.breaksPerDay) || request.breaksPerDay < 0)
		) {
			return left(new BadRequestError('Breaks per day must be a non-negative integer'))
		}

		if (request.days !== undefined && !isValidDays(request.days)) {
			return left(new BadRequestError('Days must contain unique values from 0 to 6'))
		}

		const authorization = await ensureAdminAndTarget(
			this.employeeRepository,
			request.requesterId,
			request.employeeId,
		)

		if (authorization.isLeft()) {
			return left(authorization.value)
		}

		const workSchedule = await this.workScheduleRepository.findByEmployeeId(
			request.employeeId,
		)

		if (!workSchedule) {
			return left(new NotFoundError('Work schedule not found'))
		}

		const nextStartTime = request.startTime ?? workSchedule.startTime
		const nextEndTime = request.endTime ?? workSchedule.endTime
		const nextDays = request.days ?? workSchedule.days
		const nextDayOverrides = request.dayOverrides ?? workSchedule.dayOverrides
		const dayOverridesError = validateDayOverrides(
			nextDayOverrides,
			nextDays,
			nextStartTime,
			nextEndTime,
		)

		if (dayOverridesError) {
			return left(new BadRequestError(dayOverridesError))
		}

		if (nextStartTime >= nextEndTime) {
			return left(new BadRequestError('Start time must be before end time'))
		}

		workSchedule.startTime = nextStartTime
		workSchedule.endTime = nextEndTime
		workSchedule.breakStartTime =
			request.breakStartTime !== undefined
				? request.breakStartTime
				: workSchedule.breakStartTime
		workSchedule.breakEndTime =
			request.breakEndTime !== undefined
				? request.breakEndTime
				: workSchedule.breakEndTime
		workSchedule.lateTolerance = request.lateTolerance ?? workSchedule.lateTolerance
		workSchedule.breaksPerDay = request.breaksPerDay ?? workSchedule.breaksPerDay
		workSchedule.days = nextDays
		workSchedule.dayOverrides = nextDayOverrides

		await this.workScheduleRepository.update(workSchedule)

		return right(undefined)
	}
}
