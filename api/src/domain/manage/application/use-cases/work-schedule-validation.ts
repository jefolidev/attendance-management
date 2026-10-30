import type { WorkScheduleDayOverride } from '../../enterprise/entities/work-schedule'

export function validateDayOverrides(
	overrides: WorkScheduleDayOverride[],
	days: number[],
	defaultStartTime: string,
	defaultEndTime: string,
): string | null {
	const overrideDays = overrides.map((override) => override.dayOfWeek)

	if (
		overrideDays.some((day) => !Number.isInteger(day) || day < 0 || day > 6) ||
		new Set(overrideDays).size !== overrideDays.length
	) {
		return 'Day overrides must contain unique values from 0 to 6'
	}

	for (const override of overrides) {
		if (!days.includes(override.dayOfWeek)) {
			return 'Day overrides must belong to selected work days'
		}

		const startTime = override.startTime ?? defaultStartTime
		const endTime = override.endTime ?? defaultEndTime

		if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
			return 'Day override times must use the HH:mm format'
		}

		const [startHour = -1, startMinute = -1] = startTime.split(':').map(Number)
		const [endHour = -1, endMinute = -1] = endTime.split(':').map(Number)

		if (
			startHour > 23 ||
			startMinute > 59 ||
			endHour > 23 ||
			endMinute > 59
		) {
			return 'Day override times must be valid times'
		}

		if (startTime >= endTime) {
			return 'Day override start time must be before end time'
		}
	}

	return null
}
