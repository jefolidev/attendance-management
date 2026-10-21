import { UniqueEntityId } from '@src/core/entities/unique-entity-id'
import type { TimeEntryRepository } from '@src/domain/manage/application/repositories/time-entry.repository'
import type { TimeEntry } from '@src/domain/manage/enterprise/entities/time-entry'

export class InMemoryTimeEntryRepository implements TimeEntryRepository {
	public items: TimeEntry[] = []

	async create(timeEntry: TimeEntry): Promise<void> {
		await this.items.push(timeEntry)
	}

	async findById(id: string): Promise<TimeEntry | null> {
		const timeEntry = this.items.find((timeEntry) =>
			timeEntry.id.equals(new UniqueEntityId(id)),
		)

		return timeEntry || null
	}

	async findByEmployeeId(employeeId: string): Promise<TimeEntry[]> {
		const timeEntries = this.items.filter((timeEntry) =>
			timeEntry.employeeId.equals(new UniqueEntityId(employeeId)),
		)

		return timeEntries
	}

	async update(timeEntry: TimeEntry): Promise<void> {
		const index = this.items.findIndex((t) => t.id.equals(timeEntry.id))

		if (index !== -1) {
			this.items[index] = timeEntry
		}
	}

	async delete(id: string): Promise<void> {
		const index = this.items.findIndex((t) =>
			t.id.equals(new UniqueEntityId(id)),
		)

		if (index !== -1) {
			this.items.splice(index, 1)
		}
	}
}
