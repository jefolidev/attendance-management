import type { Optional } from '@src/core/entities/types/optional'
import dayjs from 'dayjs'
import { AggregateRoot } from '../../../../core/entities/aggregate'
import type { UniqueEntityId } from '../../../../core/entities/unique-entity-id'

export enum TimeEntryStage {
	CLOCKED_IN = 'clocked-in',
	CLOCKED_OUT = 'clocked-out',
	ON_BREAK = 'on-break',
}

export type TimeEntryBreaks = { start: Date; end: Date | null }[]

export interface TimeEntryProps {
	clockIn: Date
	clockOut?: Date

	breaks: TimeEntryBreaks

	status: TimeEntryStage

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

	set clockOut(clockOut: Date | undefined) {
		this.props.clockOut = clockOut
		this.props.status = TimeEntryStage.CLOCKED_OUT
		this.props.updatedAt = new Date()
	}

	get status(): TimeEntryStage {
		return this.props.status
	}

	get breaks(): TimeEntryBreaks {
		return this.props.breaks
	}

	get employeeId(): UniqueEntityId {
		return this.props.employeeId
	}

	get updatedAt(): Date | undefined {
		return this.props.updatedAt
	}

	haveAnActiveBreak(): boolean {
		return this.props.breaks.some((b) => b.end === null)
	}

	haveAnActiveEntry(): boolean {
		return (
			this.props.status === TimeEntryStage.CLOCKED_IN ||
			this.props.status === TimeEntryStage.ON_BREAK
		)
	}

	startBreak(breakIn: Date): void {
		if (this.haveAnActiveBreak()) {
			throw new Error('Already have an active break.')
		}

		this.props.breaks.push({ start: breakIn, end: null })
		this.props.status = TimeEntryStage.ON_BREAK
		this.props.updatedAt = new Date()
	}

	endBreak(breakOut: Date): void {
		const activeBreak = this.props.breaks.find((b) => b.end === null)

		if (!activeBreak) {
			throw new Error('No active break to end.')
		}

		activeBreak.end = breakOut
		this.props.status = TimeEntryStage.CLOCKED_IN
		this.props.updatedAt = new Date()
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

	calculateTotalTime(): number {
		if (!this.props.clockOut) {
			return -1
		}

		const total = this.props.clockOut.getTime() - this.props.clockIn.getTime()

		const breaksTotalTime = this.props.breaks.reduce((acc, b) => {
			if (b.end) {
				return acc + (b.end.getTime() - b.start.getTime())
			}
			return acc
		}, 0)

		return total - breaksTotalTime
	}

	hasReachedEarlierThanWorkStartTime(workStartTime: Date): boolean {
		return dayjs(this.props.clockIn).isBefore(workStartTime)
	}

	hasReachedLaterThanWorkStartTime(workStartTime: Date): boolean {
		return dayjs(this.props.clockIn).isAfter(workStartTime)
	}

	hasDepartedLaterThanWorkEndTime(workEndTime: Date): boolean {
		return this.props.clockOut
			? dayjs(this.props.clockOut).isAfter(workEndTime)
			: false
	}

	hasDepartedEarlierThanWorkEndTime(workEndTime: Date): boolean {
		return this.props.clockOut
			? dayjs(this.props.clockOut).isBefore(workEndTime)
			: false
	}

	static create(
		props: Optional<TimeEntryProps, 'breaks'>,
		id?: UniqueEntityId,
	): TimeEntry {
		const timeEntry = new TimeEntry(
			{
				breaks: [],
				...props,
			},
			id,
		)

		return timeEntry
	}
}
