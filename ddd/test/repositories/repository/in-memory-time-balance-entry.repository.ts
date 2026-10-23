import { UniqueEntityId } from '@src/core/entities/unique-entity-id'
import type { TimeBalanceEntryRepository } from '@src/domain/manage/application/repositories/time-balance-entry.repository'
import {
	TimeBalanceEntry,
	type TimeBalanceEntryReason,
} from '@src/domain/manage/enterprise/entities/time-balance-entry'
import type { InMemoryTimeBalanceRepository } from './in-memory-time-balance.repository'

export class InMemoryTimeBalanceEntryRepository
	implements TimeBalanceEntryRepository
{
	constructor(
		private readonly timeBalanceRepository: InMemoryTimeBalanceRepository,
	) {}

	public items: TimeBalanceEntry[] = []

	async addDebitEntry(
		employeeId: string,
		amount: number,
		reason: TimeBalanceEntryReason,
	) {
		return this.registerEntry(employeeId, 'DEBIT', amount, reason)
	}

	async addCreditEntry(
		employeeId: string,
		amount: number,
		reason: TimeBalanceEntryReason,
	) {
		return this.registerEntry(employeeId, 'CREDIT', amount, reason)
	}

	private async registerEntry(
		employeeId: string,
		type: 'DEBIT' | 'CREDIT',
		amount: number,
		reason: TimeBalanceEntryReason,
	): Promise<void> {
		const timeBalance =
			await this.timeBalanceRepository.findByEmployeeId(employeeId)

		if (!timeBalance) {
			throw new Error('Time balance not found for this employee')
		}

		const timeBalanceEntry = TimeBalanceEntry.create({
			type,
			reason,
			durationInMinutes: amount,
			createdAt: new Date(),
			employeeId: new UniqueEntityId(employeeId),
		})

		this.items.push(timeBalanceEntry)
		timeBalance.addEvent(timeBalanceEntry)

		timeBalance.applyEntry(type, amount)
		await this.timeBalanceRepository.update(timeBalance)
	}
}
