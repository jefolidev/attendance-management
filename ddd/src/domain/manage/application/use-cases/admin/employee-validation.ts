export function validateUsername(username: unknown): string | null {
	if (typeof username !== 'string' || username.trim().length < 2) {
		return 'Username must contain at least 2 characters'
	}

	if (username.trim().length > 100) {
		return 'Username must contain at most 100 characters'
	}

	return null
}

export function validatePassword(password: unknown): string | null {
	if (typeof password !== 'string' || password.length < 8) {
		return 'Password must contain at least 8 characters'
	}

	if (password.length > 100) {
		return 'Password must contain at most 100 characters'
	}

	return null
}

export function validateRole(role: unknown): string | null {
	if (role !== 'ADMIN' && role !== 'EMPLOYEE') {
		return 'Role must be ADMIN or EMPLOYEE'
	}

	return null
}

export function validateTime(value: unknown, field: string): string | null {
	if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) {
		return `${field} must use the HH:mm format`
	}

	const [hours, minutes] = value.split(':').map(Number)

	if (hours === undefined || minutes === undefined || hours > 23 || minutes > 59) {
		return `${field} must be a valid time`
	}

	return null
}
