import { Entity } from '../../../../core/entities/entity';
import type { Optional } from '../../../../core/entities/types/optional';
import type { UniqueEntityId } from '../../../../core/entities/unique-entity-id';

export type TimeBalanceEntryType = 'CREDIT' | 'DEBIT'

export type TimeBalanceEntryReason =
	| 'LATE_ARRIVAL'
	| 'EARLY_DEPARTURE'
	| 'OVERTIME'
	| 'COMPENSATION'
	| 'EXTRA'
	| 'MANUAL_ADJUSTMENT'

export const AUTOMATIC_TIME_BALANCE_ENTRY_REASONS = [
	'LATE_ARRIVAL',
	'EARLY_DEPARTURE',
	'OVERTIME',
	'COMPENSATION',
	'EXTRA',
] as const satisfies readonly TimeBalanceEntryReason[]

export function isAutomaticTimeBalanceEntryReason(
	reason: TimeBalanceEntryReason,
): boolean {
	return AUTOMATIC_TIME_BALANCE_ENTRY_REASONS.includes(reason as never)
}

export interface TimeBalanceEntryProps {
	employeeId: UniqueEntityId
	timeBalanceId: UniqueEntityId
	timeEntryId?: UniqueEntityId | null
	type: TimeBalanceEntryType
	reason: TimeBalanceEntryReason

	durationInMinutes: number

	createdAt: Date
}

export class TimeBalanceEntry extends Entity<TimeBalanceEntryProps> {
	get employeeId(): UniqueEntityId {
		return this.props.employeeId
	}

	get timeBalanceId(): UniqueEntityId {
		return this.props.timeBalanceId
	}

	get timeEntryId(): UniqueEntityId | null | undefined {
		return this.props.timeEntryId
	}

	get type(): TimeBalanceEntryType {
		return this.props.type
	}

	get reason(): TimeBalanceEntryReason {
		return this.props.reason
	}

	get durationInMinutes(): number {
		return this.props.durationInMinutes
	}

	get createdAt(): Date {
		return this.props.createdAt
	}

	get signedDurationInMinutes(): number {
		return this.props.type === 'CREDIT'
			? this.props.durationInMinutes
			: -this.props.durationInMinutes
	}

	static create(
		props: Optional<TimeBalanceEntryProps, 'createdAt'>,
		id?: UniqueEntityId,
	): TimeBalanceEntry {
		return new TimeBalanceEntry(
			{
				...props,
				createdAt: props.createdAt ?? new Date(),
			},
			id,
		)
	}
}
