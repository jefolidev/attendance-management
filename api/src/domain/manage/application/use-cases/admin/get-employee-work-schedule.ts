import { left, right, type Either } from '@src/core/either'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import type { WorkSchedule } from '../../../enterprise/entities/work-schedule'
import type { EmployeeRepository } from '../../repositories/employee.repository'
import type { WorkScheduleRepository } from '../../repositories/work-schedule.repository'
import { ensureAdminAndTarget } from './ensure-admin'

interface GetEmployeeWorkScheduleUseCaseRequest {
	requesterId: string
	employeeId: string
}

export class GetEmployeeWorkScheduleUseCase {
	constructor(
		private readonly employeeRepository: EmployeeRepository,
		private readonly workScheduleRepository: WorkScheduleRepository,
	) {}

	async execute({
		requesterId,
		employeeId,
	}: GetEmployeeWorkScheduleUseCaseRequest): Promise<
		Either<NotAllowedError | NotFoundError, WorkSchedule>
	> {
		const authorization = await ensureAdminAndTarget(
			this.employeeRepository,
			requesterId,
			employeeId,
		)

		if (authorization.isLeft()) {
			return left(authorization.value)
		}

		const workSchedule = await this.workScheduleRepository.findByEmployeeId(employeeId)

		if (!workSchedule) {
			return left(new NotFoundError('Work schedule not found'))
		}

		return right(workSchedule)
	}
}
