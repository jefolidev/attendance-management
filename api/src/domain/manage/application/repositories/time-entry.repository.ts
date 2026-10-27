import type { TimeEntry } from '../../enterprise/entities/time-entry'

export abstract class TimeEntryRepository {
	abstract create(timeEntry: TimeEntry): Promise<void>
	abstract findById(id: string): Promise<TimeEntry | null>
	abstract findByEmployeeId(employeeId: string): Promise<TimeEntry[]>

	abstract findInProgressByEmployeeId(
		employeeId: string,
	): Promise<TimeEntry | null>

	abstract findCompletedByEmployeeId(employeeId: string): Promise<TimeEntry[]>

	abstract update(timeEntry: TimeEntry): Promise<void>
	abstract delete(id: string): Promise<void>
}
