import { left, right, type Either } from '@src/core/either'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import type { EmployeeRepository } from '../../repositories/employee.repository'
import type { TimeEntryRepository } from '../../repositories/time-entry.repository'
import type { WorkScheduleRepository } from '../../repositories/work-schedule.repository'
import { GetAccumulatedDelayTimeUseCase } from '../get-accumulated-delay-time'
import { ensureAdminAndTarget } from './ensure-admin'

interface GetEmployeeDelaysUseCaseRequest {
	requesterId: string
	employeeId: string
}

type GetEmployeeDelaysUseCaseResponse = Either<
	NotAllowedError | NotFoundError,
	{
		totalLateMinutes: number
		compensatedMinutes: number
		uncompensatedMinutes: number
	}
>

export class GetEmployeeDelaysUseCase {
	private readonly getAccumulatedDelayTimeUseCase: GetAccumulatedDelayTimeUseCase

	constructor(
		private readonly employeeRepository: EmployeeRepository,
		workScheduleRepository: WorkScheduleRepository,
		timeEntryRepository: TimeEntryRepository,
	) {
		this.getAccumulatedDelayTimeUseCase = new GetAccumulatedDelayTimeUseCase(
			employeeRepository,
			workScheduleRepository,
			timeEntryRepository,
		)
	}

	async execute({
		requesterId,
		employeeId,
	}: GetEmployeeDelaysUseCaseRequest): Promise<GetEmployeeDelaysUseCaseResponse> {
		const authorization = await ensureAdminAndTarget(
			this.employeeRepository,
			requesterId,
			employeeId,
		)

		if (authorization.isLeft()) {
			return left(authorization.value)
		}

		const result = await this.getAccumulatedDelayTimeUseCase.execute({
			requesterId: authorization.value.id.toString(),
		})

		if (result.isLeft()) {
			return left(result.value)
		}

		return right(result.value)
	}
}
