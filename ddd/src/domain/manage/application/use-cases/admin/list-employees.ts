import { left, right, type Either } from '@src/core/either'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import type { EmployeeRepository } from '../../repositories/employee.repository'
import { ensureAdmin } from './ensure-admin'

interface ListEmployeesUseCaseRequest {
	requesterId: string
}

export interface EmployeeListItem {
	id: string
	username: string
	role: 'ADMIN' | 'EMPLOYEE'
	createdAt: Date
	updatedAt?: Date
}

type ListEmployeesUseCaseResponse = Either<NotAllowedError, EmployeeListItem[]>

export class ListEmployeesUseCase {
	constructor(private readonly employeeRepository: EmployeeRepository) {}

	async execute({
		requesterId,
	}: ListEmployeesUseCaseRequest): Promise<ListEmployeesUseCaseResponse> {
		const authorization = await ensureAdmin(
			this.employeeRepository,
			requesterId,
		)

		if (authorization.isLeft()) {
			return left(authorization.value)
		}

		const employees = await this.employeeRepository.findAll()

		return right(
			employees.map((employee) => ({
				id: employee.id.toString(),
				username: employee.username,
				role: employee.role,
				createdAt: employee.createdAt,
				updatedAt: employee.updatedAt,
			})),
		)
	}
}
