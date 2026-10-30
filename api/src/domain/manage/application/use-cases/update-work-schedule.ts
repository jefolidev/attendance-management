import { type Either, left, right } from '@src/core/either'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import type { EmployeeRepository } from '../repositories/employee.repository'
import type { WorkScheduleRepository } from '../repositories/work-schedule.repository'

interface UpdateWorkScheduleUseCaseRequest {
	startTime?: string
	endTime?: string
	breakStartTime?: string | null
	breakEndTime?: string | null

	lateTolerance?: number

	breaksPerDay?: number

	days?: number[]
	requesterId: string
}

type UpdateWorkScheduleUseCaseResponse = Either<NotFoundError, unknown>

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

		workSchedule.breaksPerDay = breaksPerDay ?? workSchedule.breaksPerDay
		workSchedule.days = days ?? workSchedule.days
		workSchedule.endTime = endTime ?? workSchedule.endTime
		workSchedule.breakStartTime =
			breakStartTime !== undefined ? breakStartTime : workSchedule.breakStartTime
		workSchedule.breakEndTime =
			breakEndTime !== undefined ? breakEndTime : workSchedule.breakEndTime
		workSchedule.lateTolerance = lateTolerance ?? workSchedule.lateTolerance
		workSchedule.startTime = startTime ?? workSchedule.startTime

		await this.workScheduleRepository.update(workSchedule)

		return right({})
	}
}
