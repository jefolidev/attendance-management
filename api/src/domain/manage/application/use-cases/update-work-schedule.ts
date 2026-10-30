import { type Either, left, right } from '@src/core/either'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import type { EmployeeRepository } from '../repositories/employee.repository'
import type { WorkScheduleRepository } from '../repositories/work-schedule.repository'
import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import type { WorkScheduleDayOverride } from '../../enterprise/entities/work-schedule'
import { validateDayOverrides } from './work-schedule-validation'

interface UpdateWorkScheduleUseCaseRequest {
	startTime?: string
	endTime?: string
	breakStartTime?: string | null
	breakEndTime?: string | null

	lateTolerance?: number

	breaksPerDay?: number

	days?: number[]
	dayOverrides?: WorkScheduleDayOverride[]
	requesterId: string
}

type UpdateWorkScheduleUseCaseResponse = Either<NotFoundError | BadRequestError, unknown>

export class UpdateWorkScheduleUseCase {
	constructor(
		private readonly employeeRepository: EmployeeRepository,
		private readonly workScheduleRepository: WorkScheduleRepository,
	) {}

	async execute({
		requesterId,
		breaksPerDay,
		days,
		endTime,
		breakStartTime,
		breakEndTime,
		lateTolerance,
		startTime,
		dayOverrides,
	}: UpdateWorkScheduleUseCaseRequest): Promise<UpdateWorkScheduleUseCaseResponse> {
		const employee = await this.employeeRepository.findById(requesterId)

		if (!employee) {
			return left(new NotFoundError('Employee not found'))
		}

		const workSchedule =
			await this.workScheduleRepository.findByEmployeeId(requesterId)

		if (!workSchedule) {
			return left(new NotFoundError('Work schedule not found'))
		}

		const nextDays = days ?? workSchedule.days
		const nextStartTime = startTime ?? workSchedule.startTime
		const nextEndTime = endTime ?? workSchedule.endTime
		const nextDayOverrides = dayOverrides ?? workSchedule.dayOverrides

		if (nextStartTime >= nextEndTime) {
			return left(new BadRequestError('Start time must be before end time'))
		}

		const dayOverridesError = validateDayOverrides(
			nextDayOverrides,
			nextDays,
			nextStartTime,
			nextEndTime,
		)

		if (dayOverridesError) return left(new BadRequestError(dayOverridesError))

		workSchedule.breaksPerDay = breaksPerDay ?? workSchedule.breaksPerDay
		workSchedule.breakStartTime =
			breakStartTime !== undefined ? breakStartTime : workSchedule.breakStartTime
		workSchedule.breakEndTime =
			breakEndTime !== undefined ? breakEndTime : workSchedule.breakEndTime
		workSchedule.lateTolerance = lateTolerance ?? workSchedule.lateTolerance
		workSchedule.startTime = nextStartTime
		workSchedule.endTime = nextEndTime
		workSchedule.days = nextDays
		workSchedule.dayOverrides = nextDayOverrides

		await this.workScheduleRepository.update(workSchedule)

		return right({})
	}
}
