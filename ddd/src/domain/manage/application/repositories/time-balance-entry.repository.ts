import type { TimeBalanceEntryReason } from '../../enterprise/entities/time-balance-entry'

export abstract class TimeBalanceEntryRepository {
	abstract addDebitEntry(
		employeeId: string,
		amount: number,
		reason: TimeBalanceEntryReason,
	): Promise<void>
	abstract addCreditEntry(
		employeeId: string,
		amount: number,
		reason: TimeBalanceEntryReason,
	): Promise<void>
}
