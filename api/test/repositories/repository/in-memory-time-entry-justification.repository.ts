import { UniqueEntityId } from '../../../src/core/entities/unique-entity-id'
import type { TimeEntryJustificationRepository } from '../../../src/domain/manage/application/repositories/time-entry-justification.repository'
import type { TimeEntryJustification } from '../../../src/domain/manage/enterprise/entities/time-entry-justification'

export class InMemoryTimeEntryJustificationRepository
	implements TimeEntryJustificationRepository
{
	public items: TimeEntryJustification[] = []

	async create(justification: TimeEntryJustification): Promise<void> {
		this.items.push(justification)
	}

	async findByTimeEntryId(timeEntryId: string): Promise<TimeEntryJustification[]> {
		return this.items.filter((item) => item.timeEntryId.equals(new UniqueEntityId(timeEntryId)))
	}

	async findByEmployeeId(employeeId: string): Promise<TimeEntryJustification[]> {
		return this.items.filter((item) => item.employeeId.equals(new UniqueEntityId(employeeId)))
	}

	async findByTimeEntryAndType(
		timeEntryId: string,
		type: TimeEntryJustification['type'],
	): Promise<TimeEntryJustification | null> {
		return this.items.find(
			(item) =>
				item.timeEntryId.equals(new UniqueEntityId(timeEntryId)) && item.type === type,
		) ?? null
	}

	async delete(id: string): Promise<void> {
		this.items = this.items.filter((item) => item.id.toString() !== id)
	}
}
