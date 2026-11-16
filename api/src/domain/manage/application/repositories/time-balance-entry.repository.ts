import type { TimeBalanceEntryReason } from '../../enterprise/entities/time-balance-entry'

export interface AutomaticTimeBalanceEntry {
	type: 'CREDIT' | 'DEBIT'
	reason: TimeBalanceEntryReason
	durationInMinutes: number
	createdAt: Date
	timeEntryId: string
}

export abstract class TimeBalanceEntryRepository {
	abstract addDebitEntry(
		employeeId: string,
		amount: number,
		reason: TimeBalanceEntryReason,
		createdAt?: Date,
		timeEntryId?: string,
	): Promise<void>
	abstract addCreditEntry(
		employeeId: string,
		amount: number,
		reason: TimeBalanceEntryReason,
		createdAt?: Date,
		timeEntryId?: string,
	): Promise<void>
	abstract replaceAutomaticEntries(
		employeeId: string,
		entries: AutomaticTimeBalanceEntry[],
	): Promise<void>
}
