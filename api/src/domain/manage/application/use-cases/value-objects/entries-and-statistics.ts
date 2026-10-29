import { ValueObject } from '@src/core/entities/value-object'
import type {
	TimeEntryBreaks,
	TimeEntryStage,
} from '@src/domain/manage/enterprise/entities/time-entry'

export interface EntriesAndStatisticsProps {
	timeEntryStage: TimeEntryStage
	occurredAt: Date
	breaks: TimeEntryBreaks
	entryMinutesEarly: number
	entryMinutesLate: number
	departureMinutesEarly: number
	departureMinutesLate: number
	totalWorkedMinutes: number
}

export class EntriesAndStatistics extends ValueObject<EntriesAndStatisticsProps> {
	get timeEntryStage() {
		return this.props.timeEntryStage
	}

	get occurredAt() {
		return this.props.occurredAt
	}

	get breaks() {
		return this.props.breaks
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

	static create(props: EntriesAndStatisticsProps): EntriesAndStatistics {
		return new EntriesAndStatistics(props)
	}
}
