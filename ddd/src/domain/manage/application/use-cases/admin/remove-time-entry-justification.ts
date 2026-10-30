import { left, right, type Either } from '@src/core/either'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import type { EmployeeRepository } from '../../repositories/employee.repository'
import type { TimeEntryJustificationRepository } from '../../repositories/time-entry-justification.repository'
import type { TimeEntryRepository } from '../../repositories/time-entry.repository'
import type { TimeEntryJustificationType } from '../../../enterprise/entities/time-entry-justification'
import { RecalculateEmployeeTimeBalanceUseCase } from './recalculate-employee-time-balance'
import { ensureAdminAndTarget } from './ensure-admin'

interface RemoveTimeEntryJustificationRequest {
	requesterId: string
	employeeId: string
	timeEntryId: string
	type: TimeEntryJustificationType
}

type RemoveTimeEntryJustificationResponse = Either<NotAllowedError | NotFoundError, void>

export class RemoveTimeEntryJustificationUseCase {
	constructor(
		private readonly employeeRepository: EmployeeRepository,
		private readonly timeEntryRepository: TimeEntryRepository,
		private readonly justificationRepository: TimeEntryJustificationRepository,
		private readonly recalculateEmployeeTimeBalance: RecalculateEmployeeTimeBalanceUseCase,
	) {}

	async execute(request: RemoveTimeEntryJustificationRequest): Promise<RemoveTimeEntryJustificationResponse> {
		const authorization = await ensureAdminAndTarget(this.employeeRepository, request.requesterId, request.employeeId)
		if (authorization.isLeft()) return left(authorization.value)
		const timeEntry = await this.timeEntryRepository.findById(request.timeEntryId)
		if (!timeEntry || timeEntry.employeeId.toString() !== request.employeeId) return left(new NotFoundError('Time entry not found'))
		const justification = await this.justificationRepository.findByTimeEntryAndType(request.timeEntryId, request.type)
		if (!justification) return left(new NotFoundError('Justification not found'))
		await this.justificationRepository.delete(justification.id.toString())
		await this.recalculateEmployeeTimeBalance.execute({ employeeId: request.employeeId })
		return right(undefined)
	}
}
