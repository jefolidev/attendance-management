import type { TimeEntry } from '../../enterprise/entities/time-entry'
import type { PaginationParams } from '@src/core/repositories/pagination'

export abstract class TimeEntryRepository {
	abstract create(timeEntry: TimeEntry): Promise<void>
	abstract findById(id: string): Promise<TimeEntry | null>
	abstract findByEmployeeId(
		employeeId: string,
		paginationParams?: PaginationParams,
	): Promise<TimeEntry[]>

	abstract findInProgressByEmployeeId(
		employeeId: string,
	): Promise<TimeEntry | null>

	abstract findCompletedByEmployeeId(employeeId: string): Promise<TimeEntry[]>

	abstract update(timeEntry: TimeEntry): Promise<void>
	abstract delete(id: string): Promise<void>
}
