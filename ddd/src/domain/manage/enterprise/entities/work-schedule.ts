import dayjs from 'dayjs'
import { AggregateRoot } from '../../../../core/entities/aggregate'
import type { UniqueEntityId } from '../../../../core/entities/unique-entity-id'

interface WorkScheduleProps {
	startTime: string
	endTime: string

	lateTolerance: number

	breaksPerDay: number

	days: number[]

	employeeId: UniqueEntityId
}

export class WorkSchedule extends AggregateRoot<WorkScheduleProps> {
	get startTime(): string {
		return this.props.startTime
	}

	set startTime(value: string) {
		this.props.startTime = value
	}

	set endTime(value: string) {
		this.props.endTime = value
	}

	set lateTolerance(value: number) {
		this.props.lateTolerance = value
	}

	set days(value: number[]) {
		this.props.days = value
	}

	set breaksPerDay(value: number) {
		this.props.breaksPerDay = value
	}

	get endTime(): string {
		return this.props.endTime
	}

	get employeeId(): UniqueEntityId {
		return this.props.employeeId
	}

	get lateTolerance(): number {
		return this.props.lateTolerance
	}

	get days(): number[] {
		return this.props.days
	}

	get breaksPerDay(): number {
		return this.props.breaksPerDay
	}

	isLate(clockIn: Date): boolean {
		const scheduledStartTime = this.startTimeToDate()
		const hittedPoint = dayjs(clockIn)

		return hittedPoint.isAfter(scheduledStartTime)
	}

	isLateWithTolerance(clockIn: Date): boolean {
		const scheduledStartTime = this.startTimeToDate()
		const hittedPoint = dayjs(clockIn)

		return hittedPoint.isAfter(scheduledStartTime)
	}

	isEarly(clockIn: Date): boolean {
		const scheduledStartTime = this.startTimeToDate()
		const hittedPoint = dayjs(clockIn)

		return hittedPoint.isBefore(scheduledStartTime)
	}

	isDepartedEarly(clockOut: Date): boolean {
		const scheduledEndTime = this.endTimeToDate()
		const hittedPoint = dayjs(clockOut)

		return hittedPoint.isBefore(scheduledEndTime)
	}

	isDepartedLate(clockOut: Date): boolean {
		const scheduledEndTime = this.endTimeToDate()
		const hittedPoint = dayjs(clockOut)

		return hittedPoint.isAfter(scheduledEndTime)
	}

	startTimeToDate() {
		return this.parseTimeStringToDate(this.startTime)
	}

	endTimeToDate() {
		return this.parseTimeStringToDate(this.endTime)
	}

	private parseTimeStringToDate(timeString: string): Date {
		const [hour, minute] = timeString.split(':').map(Number)
		return dayjs()
			.set('hour', hour || 0)
			.set('minute', minute || 0)
			.set('second', 0)
			.set('millisecond', 0)
			.toDate()
	}

	static create(props: WorkScheduleProps, id?: UniqueEntityId): WorkSchedule {
		const workSchedule = new WorkSchedule(props, id)

		return workSchedule
	}
}
