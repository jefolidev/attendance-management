import { Entity } from '../../../../core/entities/entity'
import type { Optional } from '../../../../core/entities/types/optional'
import type { UniqueEntityId } from '../../../../core/entities/unique-entity-id'

export type TimeEntryJustificationType = 'LATE_ARRIVAL' | 'EARLY_DEPARTURE'
export type TimeEntryJustificationCategory = 'MEDICAL_EMERGENCY'

export interface TimeEntryJustificationProps {
	employeeId: UniqueEntityId
	timeEntryId: UniqueEntityId
	approvedById: UniqueEntityId
	type: TimeEntryJustificationType
	category: TimeEntryJustificationCategory
	description?: string
	createdAt: Date
}

export class TimeEntryJustification extends Entity<TimeEntryJustificationProps> {
	get employeeId() { return this.props.employeeId }
	get timeEntryId() { return this.props.timeEntryId }
	get approvedById() { return this.props.approvedById }
	get type() { return this.props.type }
	get category() { return this.props.category }
	get description() { return this.props.description }
	get createdAt() { return this.props.createdAt }

	static create(
		props: Optional<TimeEntryJustificationProps, 'createdAt'>,
		id?: UniqueEntityId,
	): TimeEntryJustification {
		return new TimeEntryJustification(
			{ ...props, createdAt: props.createdAt ?? new Date() },
			id,
		)
	}
}
