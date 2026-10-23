import type { TimeEntry } from '../../enterprise/entities/time-entry'

export abstract class TimeEntryRepository {
	abstract create(timeEntry: TimeEntry): Promise<void>
	abstract findById(id: string): Promise<TimeEntry | null>
	abstract findByEmployeeId(
		employeeId: string,
		params: { page?: number },
	): Promise<TimeEntry[]>

	abstract findInProgressByEmployeeId(
		employeeId: string,
	): Promise<TimeEntry | null>

	abstract update(timeEntry: TimeEntry): Promise<void>
	abstract delete(id: string): Promise<void>
}
