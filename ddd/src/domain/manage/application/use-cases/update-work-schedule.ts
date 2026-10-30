import { type Either, left, right } from '@src/core/either'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import type { EmployeeRepository } from '../repositories/employee.repository'
import type { WorkScheduleRepository } from '../repositories/work-schedule.repository'
import type { WorkScheduleDayOverride } from '../../enterprise/entities/work-schedule'
import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { validateDayOverrides } from './work-schedule-validation'

interface UpdateWorkScheduleUseCaseRequest {
	startTime?: string
	endTime?: string

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

		const dayOverridesError = validateDayOverrides(nextDayOverrides, nextDays, nextStartTime, nextEndTime)

		if (dayOverridesError) return left(new BadRequestError(dayOverridesError))

		workSchedule.breaksPerDay = breaksPerDay ?? workSchedule.breaksPerDay
		workSchedule.lateTolerance = lateTolerance ?? workSchedule.lateTolerance
		workSchedule.startTime = nextStartTime
		workSchedule.endTime = nextEndTime
		workSchedule.days = nextDays
		workSchedule.dayOverrides = nextDayOverrides

		await this.workScheduleRepository.update(workSchedule)

		return right({})
	}
}
