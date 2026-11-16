import { UniqueEntityId } from '@src/core/entities/unique-entity-id'
import { TimeBalanceEntry } from './time-balance-entry'

describe('Time Balance Entry', () => {
	it('preserves an explicit creation date', () => {
		const createdAt = new Date('2026-10-30T10:23:00.000Z')

		const entry = TimeBalanceEntry.create({
			employeeId: new UniqueEntityId(),
			timeBalanceId: new UniqueEntityId(),
			type: 'CREDIT',
			reason: 'EXTRA',
			durationInMinutes: 37,
			createdAt,
		})

		expect(entry.createdAt).toEqual(createdAt)
	})

	it('keeps the time entry that originated an automatic movement', () => {
		const timeEntryId = new UniqueEntityId()

		const entry = TimeBalanceEntry.create({
			employeeId: new UniqueEntityId(),
			timeBalanceId: new UniqueEntityId(),
			timeEntryId,
			type: 'DEBIT',
			reason: 'LATE_ARRIVAL',
			durationInMinutes: 37,
		})

		expect(entry.timeEntryId).toEqual(timeEntryId)
	})
})
