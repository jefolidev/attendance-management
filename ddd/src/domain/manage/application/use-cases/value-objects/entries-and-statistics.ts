import { ValueObject } from '@src/core/entities/value-object'
import type { TimeEntryStage } from '@src/domain/manage/enterprise/entities/time-entry'

export interface EntriesAndStatisticsProps {
	timeEntryId: string
	timeEntryStage: TimeEntryStage
	occurredAt: Date
	entryMinutesEarly: number
	entryMinutesLate: number
	departureMinutesEarly: number
	departureMinutesLate: number
	totalWorkedMinutes: number
	justifications: Array<{
		type: 'LATE_ARRIVAL' | 'EARLY_DEPARTURE'
		category: 'MEDICAL_EMERGENCY'
		description?: string
	}>
}

export class EntriesAndStatistics extends ValueObject<EntriesAndStatisticsProps> {
	get timeEntryStage() {
		return this.props.timeEntryStage
	}

	get occurredAt() {
		return this.props.occurredAt
	}

	get entryMinutesEarly() {
		return this.props.entryMinutesEarly
	}

	get entryMinutesLate() {
		return this.props.entryMinutesLate
	}

	get departureMinutesEarly() {
		return this.props.departureMinutesEarly
	}

	get departureMinutesLate() {
		return this.props.departureMinutesLate
	}

	get totalWorkedMinutes() {
		return this.props.totalWorkedMinutes
	}

	get justifications() {
		return this.props.justifications
	}

	static create(props: EntriesAndStatisticsProps): EntriesAndStatistics {
		return new EntriesAndStatistics(props)
	}
}
