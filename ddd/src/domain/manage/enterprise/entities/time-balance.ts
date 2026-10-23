import type { Optional } from '@src/core/entities/types/optional'
import { Entity } from '../../../../core/entities/entity'
import type { UniqueEntityId } from '../../../../core/entities/unique-entity-id'
import type { TimeBalanceEntryProps } from './time-balance-entry'

interface TimeBalanceProps {
	employeeId: UniqueEntityId

	events: TimeBalanceEntryProps[]

	balanceMinutes: number

	updatedAt?: Date
}

export class TimeBalance extends Entity<TimeBalanceProps> {
	get employeeId(): UniqueEntityId {
		return this.props.employeeId
	}

	get events(): TimeBalanceEntryProps[] {
		return this.props.events
	}

	get balanceMinutes(): number {
		return this.props.balanceMinutes
	}

	get updatedAt(): Date | undefined {
		return this.props.updatedAt
	}

	touch(): void {
		this.props.updatedAt = new Date()
	}

	applyEntry(type: 'CREDIT' | 'DEBIT', minutes: number): void {
		const signal = type === 'CREDIT' ? 1 : -1
		this.props.balanceMinutes += signal * minutes
	}

	addEvent(event: TimeBalanceEntryProps): void {
		this.props.events.push(event)
	}

	static create(
		props: Optional<TimeBalanceProps, 'balanceMinutes' | 'events'>,
		id?: UniqueEntityId,
	): TimeBalance {
		const workBalance = new TimeBalance(
			{
				events: [],
				balanceMinutes: 0,
				...props,
			},
			id,
		)

		return workBalance
	}
}
