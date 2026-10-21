import { AggregateRoot } from '../../../../core/entities/aggregate'
import type { UniqueEntityId } from '../../../../core/entities/unique-entity-id'

export enum TimeEntryStage {
	CLOCKED_IN = 'clocked-in',
	CLOCKED_OUT = 'clocked-out',
	ON_BREAK = 'on-break',
}

interface TimeEntryProps {
	clockIn: Date
	clockOut?: Date

	breakStart?: Date
	breakEnd?: Date

	status: TimeEntryStage | null

	employeeId: UniqueEntityId

	updatedAt?: Date
}

export class TimeEntry extends AggregateRoot<TimeEntryProps> {
	get clockIn(): Date {
		return this.props.clockIn
	}

	get clockOut(): Date | undefined {
		return this.props.clockOut
	}

	get status(): TimeEntryStage | null {
		return this.props.status
	}

	get breakStart(): Date | undefined {
		return this.props.breakStart
	}

	get breakEnd(): Date | undefined {
		return this.props.breakEnd
	}

	get employeeId(): UniqueEntityId {
		return this.props.employeeId
	}

	get updatedAt(): Date | undefined {
		return this.props.updatedAt
	}

	haveAnActiveEntry(): boolean {
		return (
			this.props.status === TimeEntryStage.CLOCKED_IN ||
			this.props.status === TimeEntryStage.ON_BREAK
		)
	}

	isClockedIn(): boolean {
		return this.props.status === TimeEntryStage.CLOCKED_IN
	}

	isClockedOut(): boolean {
		return this.props.status === TimeEntryStage.CLOCKED_OUT
	}

	isOnBreak(): boolean {
		return this.props.status === TimeEntryStage.ON_BREAK
	}

	static create(props: TimeEntryProps, id?: UniqueEntityId): TimeEntry {
		const timeEntry = new TimeEntry(props, id)

		return timeEntry
	}
}
