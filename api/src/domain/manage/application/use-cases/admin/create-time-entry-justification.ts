import { left, right, type Either } from '@src/core/either'
import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import { UniqueEntityId } from '@src/core/entities/unique-entity-id'
import type { EmployeeRepository } from '../../repositories/employee.repository'
import type { TimeEntryJustificationRepository } from '../../repositories/time-entry-justification.repository'
import type { TimeEntryRepository } from '../../repositories/time-entry.repository'
import { TimeEntryJustification, type TimeEntryJustificationCategory, type TimeEntryJustificationType } from '../../../enterprise/entities/time-entry-justification'
import { RecalculateEmployeeTimeBalanceUseCase } from './recalculate-employee-time-balance'
import { ensureAdminAndTarget } from './ensure-admin'

interface CreateTimeEntryJustificationRequest {
	requesterId: string
	employeeId: string
	timeEntryId: string
	type: TimeEntryJustificationType
	category: TimeEntryJustificationCategory
	description?: string
}

type CreateTimeEntryJustificationResponse = Either<
	BadRequestError | NotAllowedError | NotFoundError,
	{ justificationId: string }
>

export class CreateTimeEntryJustificationUseCase {
	constructor(
		private readonly employeeRepository: EmployeeRepository,
		private readonly timeEntryRepository: TimeEntryRepository,
		private readonly justificationRepository: TimeEntryJustificationRepository,
		private readonly recalculateEmployeeTimeBalance: RecalculateEmployeeTimeBalanceUseCase,
	) {}

	async execute(
		request: CreateTimeEntryJustificationRequest,
	): Promise<CreateTimeEntryJustificationResponse> {
		const authorization = await ensureAdminAndTarget(
			this.employeeRepository,
			request.requesterId,
			request.employeeId,
		)
		if (authorization.isLeft()) return left(authorization.value)

		const timeEntry = await this.timeEntryRepository.findById(request.timeEntryId)
		if (!timeEntry || timeEntry.employeeId.toString() !== request.employeeId) {
			return left(new NotFoundError('Time entry not found'))
		}

		if (request.type === 'EARLY_DEPARTURE' && !timeEntry.clockOut) {
			return left(new BadRequestError('A saída precisa estar registrada antes de justificá-la'))
		}

		const existing = await this.justificationRepository.findByTimeEntryAndType(
			request.timeEntryId,
			request.type,
		)
		if (existing) {
			return left(new BadRequestError('Esta divergência já possui uma justificativa'))
		}

		const justification = TimeEntryJustification.create({
			employeeId: new UniqueEntityId(request.employeeId),
			timeEntryId: new UniqueEntityId(request.timeEntryId),
			approvedById: new UniqueEntityId(request.requesterId),
			type: request.type,
			category: request.category,
			description: request.description,
		})
		await this.justificationRepository.create(justification)
		await this.recalculateEmployeeTimeBalance.execute({ employeeId: request.employeeId })

		return right({ justificationId: justification.id.toString() })
	}
}
