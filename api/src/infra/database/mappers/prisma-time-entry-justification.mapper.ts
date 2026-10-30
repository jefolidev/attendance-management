import { UniqueEntityId } from '@src/core/entities/unique-entity-id'
import {
	TimeEntryJustification as TimeEntryJustificationDomain,
	type TimeEntryJustificationCategory as DomainCategory,
	type TimeEntryJustificationType as DomainType,
} from '@src/domain/manage/enterprise/entities/time-entry-justification'
import type {
	TimeEntryJustification,
	TimeEntryJustificationCategory,
	TimeEntryJustificationType,
} from '../../../../generated/prisma/client.ts'

export class PrismaTimeEntryJustificationMapper {
	static toPrisma(justification: TimeEntryJustificationDomain): TimeEntryJustification {
		return {
			id: justification.id.toString(),
			type: justification.type as TimeEntryJustificationType,
			category: justification.category as TimeEntryJustificationCategory,
			description: justification.description ?? null,
			createdAt: justification.createdAt,
			employeeId: justification.employeeId.toString(),
			timeEntryId: justification.timeEntryId.toString(),
			approvedById: justification.approvedById.toString(),
		}
	}

	static toDomain(raw: TimeEntryJustification): TimeEntryJustificationDomain {
		return TimeEntryJustificationDomain.create(
			{
				employeeId: new UniqueEntityId(raw.employeeId),
				timeEntryId: new UniqueEntityId(raw.timeEntryId),
				approvedById: new UniqueEntityId(raw.approvedById),
				type: raw.type as DomainType,
				category: raw.category as DomainCategory,
				description: raw.description ?? undefined,
				createdAt: raw.createdAt,
			},
			new UniqueEntityId(raw.id),
		)
	}
}
