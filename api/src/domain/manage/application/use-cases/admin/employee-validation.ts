export function validatePassword(password: unknown): string | null {
	if (typeof password !== 'string' || password.length < 8) {
		return 'Password must contain at least 8 characters'
	}

	if (password.length > 100) {
		return 'Password must contain at most 100 characters'
	}

	return null
}

export function validateTime(value: unknown, field: string): string | null {
	if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) {
		return `${field} must use the HH:mm format`
	}

	const [hours, minutes] = value.split(':').map(Number)

	if (
		hours === undefined ||
		minutes === undefined ||
		hours > 23 ||
		minutes > 59
	) {
		return `${field} must be a valid time`
	}

	return null
}

export function isValidDays(days: number[]): boolean {
	return (
		days.length > 0 &&
		days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) &&
		new Set(days).size === days.length
	)
}

export interface DayOverrideInput {
	dayOfWeek: number
	startTime?: string
	endTime?: string
}

export function validateDayOverrides(
	overrides: DayOverrideInput[],
	days: number[],
	defaultStartTime: string,
	defaultEndTime: string,
): string | null {
	const overrideDays = overrides.map((override) => override.dayOfWeek)

	if (new Set(overrideDays).size !== overrideDays.length) {
		return 'Day overrides must contain unique values'
	}

	for (const override of overrides) {
		if (!days.includes(override.dayOfWeek)) {
			return 'Day overrides must belong to selected work days'
		}

		const startTime = override.startTime ?? defaultStartTime
		const endTime = override.endTime ?? defaultEndTime
		const startTimeError = validateTime(startTime, 'Day override start time')
		const endTimeError = validateTime(endTime, 'Day override end time')

		if (startTimeError || endTimeError) return startTimeError || endTimeError
		if (startTime >= endTime) {
			return 'Day override start time must be before end time'
		}
	}

	return null
}
