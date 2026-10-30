import { UniqueEntityId } from '../../../src/core/entities/unique-entity-id';
import type { TimeBalanceEntryRepository } from '../../../src/domain/manage/application/repositories/time-balance-entry.repository';
import {
    TimeBalanceEntry,
    type TimeBalanceEntryReason,
} from '../../../src/domain/manage/enterprise/entities/time-balance-entry';
import type { InMemoryTimeBalanceRepository } from './in-memory-time-balance.repository';
import {
	isAutomaticTimeBalanceEntryReason,
} from '../../../src/domain/manage/enterprise/entities/time-balance-entry';
import type { AutomaticTimeBalanceEntry } from '../../../src/domain/manage/application/repositories/time-balance-entry.repository';

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

	async replaceAutomaticEntries(
		employeeId: string,
		entries: AutomaticTimeBalanceEntry[],
	): Promise<void> {
		const timeBalance = await this.timeBalanceRepository.findByEmployeeId(employeeId)
		if (!timeBalance) return

		const automaticEntries = timeBalance.events.filter((entry) =>
			isAutomaticTimeBalanceEntryReason(entry.reason),
		)
		this.items = this.items.filter(
			(entry) =>
				entry.employeeId.toString() !== employeeId ||
				!isAutomaticTimeBalanceEntryReason(entry.reason),
		)
		for (const entry of automaticEntries) {
			timeBalance.applyEntry(entry.type === 'CREDIT' ? 'DEBIT' : 'CREDIT', entry.durationInMinutes)
		}
		timeBalance.events.splice(
			0,
			timeBalance.events.length,
			...timeBalance.events.filter((entry) => !isAutomaticTimeBalanceEntryReason(entry.reason)),
		)

		for (const entry of entries) {
			const timeBalanceEntry = TimeBalanceEntry.create({
				type: entry.type,
				reason: entry.reason,
				durationInMinutes: entry.durationInMinutes,
				createdAt: new Date(),
				employeeId: new UniqueEntityId(employeeId),
				timeBalanceId: timeBalance.id,
			})
			timeBalance.events.push(timeBalanceEntry)
			this.items.push(timeBalanceEntry)
			timeBalance.applyEntry(entry.type, entry.durationInMinutes)
		}

		await this.timeBalanceRepository.update(timeBalance)
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
			timeBalanceId: timeBalance.id,
		})

		this.items.push(timeBalanceEntry)
		timeBalance.addEvent(timeBalanceEntry)

		timeBalance.applyEntry(type, amount)
		await this.timeBalanceRepository.update(timeBalance)
	}
}
