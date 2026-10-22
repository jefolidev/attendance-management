import { faker } from '@faker-js/faker'
import { UniqueEntityId } from '@src/core/entities/unique-entity-id'
import {
	TimeEntry,
	type TimeEntryProps,
	TimeEntryStage,
} from '@src/domain/manage/enterprise/entities/time-entry'

export function makeTimeEntry(
	override?: Partial<TimeEntryProps>,
	id?: UniqueEntityId,
) {
	const timeentry = TimeEntry.create(
		{
			clockIn: faker.date.recent(),
			status: TimeEntryStage.CLOCKED_IN,
			breaks: [],
			employeeId: new UniqueEntityId(),
			...override,
		},
		id,
	)

	return timeentry
}
