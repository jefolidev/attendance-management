import { type Either, left, right } from '@src/core/either'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import type { WorkSchedule } from '../../enterprise/entities/work-schedule'
import type { EmployeeRepository } from '../repositories/employee.repository'
import type { WorkScheduleRepository } from '../repositories/work-schedule.repository'

interface GetWorkScheduleUseCaseRequest {
	requesterId: string
}

type GetWorkScheduleUseCaseResponse = Either<NotFoundError, WorkSchedule>

export class GetWorkScheduleUseCase {
	constructor(
		private readonly employeeRepository: EmployeeRepository,
		private readonly workScheduleRepository: WorkScheduleRepository,
	) {}

	async execute({
		requesterId,
	}: GetWorkScheduleUseCaseRequest): Promise<GetWorkScheduleUseCaseResponse> {
		const requester = await this.employeeRepository.findById(requesterId)

		if (!requester) {
			return left(new NotFoundError('Requester not found'))
		}

		const workSchedule =
			await this.workScheduleRepository.findByEmployeeId(requesterId)

		if (!workSchedule) {
			return left(
				new NotFoundError('Work schedule not found for the given requester ID'),
			)
		}

		return right(workSchedule)
	}
}
