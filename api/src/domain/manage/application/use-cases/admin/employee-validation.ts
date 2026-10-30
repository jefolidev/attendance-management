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
