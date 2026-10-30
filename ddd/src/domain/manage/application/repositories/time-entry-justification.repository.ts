import type { TimeEntryJustification } from '../../enterprise/entities/time-entry-justification'

export abstract class TimeEntryJustificationRepository {
	abstract create(justification: TimeEntryJustification): Promise<void>
	abstract findByTimeEntryId(timeEntryId: string): Promise<TimeEntryJustification[]>
	abstract findByEmployeeId(employeeId: string): Promise<TimeEntryJustification[]>
	abstract findByTimeEntryAndType(
		timeEntryId: string,
		type: TimeEntryJustification['type'],
	): Promise<TimeEntryJustification | null>
	abstract delete(id: string): Promise<void>
}
