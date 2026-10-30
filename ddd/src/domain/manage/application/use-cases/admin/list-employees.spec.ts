import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { makeEmployee } from '@test/factories/make-employee'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { ListEmployeesUseCase } from './list-employees'

let employeeRepository: InMemoryEmployeeRepository
let sut: ListEmployeesUseCase

describe('List Employees', () => {
	beforeEach(() => {
		employeeRepository = new InMemoryEmployeeRepository()
		sut = new ListEmployeesUseCase(employeeRepository)
	})

	it('lists employees for an admin without exposing passwords', async () => {
		const admin = makeEmployee({ role: 'ADMIN' })
		const employee = makeEmployee({ username: 'employee' })
		await employeeRepository.create(admin)
		await employeeRepository.create(employee)

		const response = await sut.execute({ requesterId: admin.id.toString() })

		expect(response.isRight()).toBe(true)
		if (response.isRight()) {
			expect(response.value).toHaveLength(2)
			expect(response.value[1]).toMatchObject({
				id: employee.id.toString(),
				username: 'employee',
				role: 'EMPLOYEE',
			})
			expect(response.value[1]).not.toHaveProperty('password')
		}
	})

	it('does not allow employees to list users', async () => {
		const employee = makeEmployee()
		await employeeRepository.create(employee)

		const response = await sut.execute({ requesterId: employee.id.toString() })

		expect(response.isLeft()).toBe(true)
		expect(response.value).toBeInstanceOf(NotAllowedError)
	})

	it('rejects an unknown requester', async () => {
		const response = await sut.execute({ requesterId: 'unknown' })

		expect(response.isLeft()).toBe(true)
		expect(response.value).toBeInstanceOf(NotAllowedError)
	})
})
