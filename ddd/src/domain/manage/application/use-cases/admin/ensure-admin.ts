import { left, right, type Either } from '@src/core/either'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import type { Employee } from '../../../enterprise/entities/employee'
import type { EmployeeRepository } from '../../repositories/employee.repository'

export type AdminAuthorizationError = NotAllowedError | NotFoundError

export async function ensureAdmin(
	employeeRepository: EmployeeRepository,
	requesterId: string,
): Promise<Either<AdminAuthorizationError, Employee>> {
	const requester = await employeeRepository.findById(requesterId)

	if (!requester) {
		return left(new NotAllowedError('Requester not found'))
	}

	if (!requester.isAdmin()) {
		return left(new NotAllowedError('Only admins can perform this action'))
	}

	return right(requester)
}

export async function ensureAdminAndTarget(
	employeeRepository: EmployeeRepository,
	requesterId: string,
	targetEmployeeId: string,
): Promise<Either<AdminAuthorizationError, Employee>> {
	const authorization = await ensureAdmin(employeeRepository, requesterId)

	if (authorization.isLeft()) {
		return authorization
	}

	const target = await employeeRepository.findById(targetEmployeeId)

	if (!target) {
		return left(new NotFoundError('Employee not found'))
	}

	return right(target)
}
