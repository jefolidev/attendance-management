import { WORK_SCHEDULE_TIMEZONE } from '@src/core/time/work-schedule-timezone'
import type { AutomaticTimeBalanceEntry } from '../repositories/time-balance-entry.repository'
import type { TimeEntry } from '../../enterprise/entities/time-entry'
import type { TimeEntryJustificationType } from '../../enterprise/entities/time-entry-justification'
import type { WorkSchedule } from '../../enterprise/entities/work-schedule'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

export function calculateAutomaticTimeEntryBalance(
	timeEntry: TimeEntry,
	workSchedule: WorkSchedule,
	startingBalanceMinutes: number,
	options: {
		includeClockIn?: boolean
		includeClockOut?: boolean
		justifiedTypes?: ReadonlySet<TimeEntryJustificationType>
	} = {},
): AutomaticTimeBalanceEntry[] {
	const entries: AutomaticTimeBalanceEntry[] = []
	let balanceMinutes = startingBalanceMinutes
	const includeClockIn = options.includeClockIn ?? true
	const includeClockOut = options.includeClockOut ?? true
	const justifiedTypes = options.justifiedTypes ?? new Set<TimeEntryJustificationType>()

	const addEntry = (
		type: AutomaticTimeBalanceEntry['type'],
		reason: AutomaticTimeBalanceEntry['reason'],
		durationInMinutes: number,
		createdAt: Date,
		timeEntryId: string,
	) => {
		if (durationInMinutes <= 0) return
		entries.push({ type, reason, durationInMinutes, createdAt, timeEntryId })
		balanceMinutes += type === 'CREDIT' ? durationInMinutes : -durationInMinutes
	}

	if (includeClockIn && workSchedule.getDailySchedule(timeEntry.clockIn)) {
		const clockIn = dayjs(timeEntry.clockIn).tz(WORK_SCHEDULE_TIMEZONE)
		const expectedStart = dayjs(workSchedule.startTimeToDate(timeEntry.clockIn)).tz(
			WORK_SCHEDULE_TIMEZONE,
		)

		if (
			workSchedule.isLateWithTolerance(timeEntry.clockIn) &&
			!justifiedTypes.has('LATE_ARRIVAL')
		) {
			addEntry(
				'DEBIT',
				'LATE_ARRIVAL',
				clockIn.diff(expectedStart, 'minute'),
				timeEntry.clockIn,
				timeEntry.id.toString(),
			)
		} else if (workSchedule.isEarly(timeEntry.clockIn)) {
			addEntry(
				'CREDIT',
				balanceMinutes < 0 ? 'COMPENSATION' : 'EXTRA',
				expectedStart.diff(clockIn, 'minute'),
				timeEntry.clockIn,
				timeEntry.id.toString(),
			)
		}
	}

	if (
		includeClockOut &&
		timeEntry.clockOut &&
		workSchedule.getDailySchedule(timeEntry.clockOut)
	) {
		const clockOut = dayjs(timeEntry.clockOut).tz(WORK_SCHEDULE_TIMEZONE)
		const expectedEnd = dayjs(workSchedule.endTimeToDate(timeEntry.clockOut)).tz(
			WORK_SCHEDULE_TIMEZONE,
		)

		if (
			workSchedule.isDepartedEarly(timeEntry.clockOut) &&
			!justifiedTypes.has('EARLY_DEPARTURE')
		) {
			addEntry(
				'DEBIT',
				'EARLY_DEPARTURE',
				expectedEnd.diff(clockOut, 'minute'),
				timeEntry.clockOut,
				timeEntry.id.toString(),
			)
		} else if (workSchedule.isDepartedLate(timeEntry.clockOut)) {
			addEntry(
				'CREDIT',
				balanceMinutes < 0 ? 'COMPENSATION' : 'EXTRA',
				clockOut.diff(expectedEnd, 'minute'),
				timeEntry.clockOut,
				timeEntry.id.toString(),
			)
		}
	}

	return entries
}
