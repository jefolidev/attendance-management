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

	static create(props: WorkScheduleProps, id?: UniqueEntityId): WorkSchedule {
		const workSchedule = new WorkSchedule(props, id)

		return workSchedule
	}
}
