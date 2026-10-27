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

export interface TimeBalanceEntryProps {
	employeeId: UniqueEntityId
	timeBalanceId: UniqueEntityId
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
				createdAt: new Date(),
			},
			id,
		)
	}
}
