import { left, right, type Either } from '@src/core/either'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { normalizePagination, type PaginationMeta } from '@src/core/repositories/pagination'
import type { EmployeeRepository } from '../../repositories/employee.repository'
import { ensureAdmin } from './ensure-admin'

interface ListEmployeesUseCaseRequest {
	requesterId: string
	page?: number
	perPage?: number
	sort?: 'asc' | 'desc'
}

export interface EmployeeListItem {
	id: string
	username: string
	role: 'ADMIN' | 'EMPLOYEE'
	createdAt: Date
	updatedAt: Date | null | undefined
}

export interface EmployeeListResult {
	employees: EmployeeListItem[]
	pagination: PaginationMeta & { totalPages: number }
}

export class ListEmployeesUseCase {
	constructor(private readonly employeeRepository: EmployeeRepository) {}

	async execute({
		requesterId,
		page,
		perPage,
		sort,
	}: ListEmployeesUseCaseRequest): Promise<Either<NotAllowedError, EmployeeListResult>> {
		const authorization = await ensureAdmin(this.employeeRepository, requesterId)

		if (authorization.isLeft()) {
			return left(authorization.value)
		}

		const pagination = normalizePagination({ page, perPage, sort })
		const employees = (await this.employeeRepository.findAll()).sort((first, second) => {
			const comparison = first.createdAt.getTime() - second.createdAt.getTime()
			return pagination.sort === 'asc' ? comparison : -comparison
		})
		const start = (pagination.page - 1) * pagination.perPage

		return right(
			{
				employees: employees.slice(start, start + pagination.perPage).map((employee) => ({
					id: employee.id.toString(),
					username: employee.username,
					role: employee.role,
					createdAt: employee.createdAt,
					updatedAt: employee.updatedAt,
				})),
				pagination: {
					...pagination,
					hasNextPage: employees.length > start + pagination.perPage,
					totalPages: Math.max(1, Math.ceil(employees.length / pagination.perPage)),
				},
			},
		)
	}
}
