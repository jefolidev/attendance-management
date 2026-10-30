import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import { makeEmployee } from '@test/factories/make-employee'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { InMemoryTimeBalanceRepository } from '@test/repositories/repository/in-memory-time-balance.repository'
import { TimeBalance } from '../../../enterprise/entities/time-balance'
import { GetEmployeeBalanceUseCase } from './get-employee-balance'

let employeeRepository: InMemoryEmployeeRepository
let balanceRepository: InMemoryTimeBalanceRepository
let sut: GetEmployeeBalanceUseCase

describe('Get Employee Balance', () => {
	beforeEach(() => {
		employeeRepository = new InMemoryEmployeeRepository()
		balanceRepository = new InMemoryTimeBalanceRepository()
		sut = new GetEmployeeBalanceUseCase(employeeRepository, balanceRepository)
	})

	it('gets another employee balance for an admin', async () => {
		const admin = makeEmployee({ role: 'ADMIN' })
		const employee = makeEmployee()
		await employeeRepository.create(admin)
		await employeeRepository.create(employee)
		await balanceRepository.create(
			TimeBalance.create({ employeeId: employee.id, balanceMinutes: 75 }),
		)

		const response = await sut.execute({
			requesterId: admin.id.toString(),
			employeeId: employee.id.toString(),
		})

		expect(response.isRight()).toBe(true)
		if (response.isRight()) expect(response.value.balance.balanceMinutes).toBe(75)
	})

	it('does not allow a non-admin to inspect balance', async () => {
		const requester = makeEmployee()
		const employee = makeEmployee()
		await employeeRepository.create(requester)
		await employeeRepository.create(employee)

		const response = await sut.execute({
			requesterId: requester.id.toString(),
			employeeId: employee.id.toString(),
		})

		expect(response.isLeft()).toBe(true)
		expect(response.value).toBeInstanceOf(NotAllowedError)
	})

	it('rejects an unknown target', async () => {
		const admin = makeEmployee({ role: 'ADMIN' })
		await employeeRepository.create(admin)

		const response = await sut.execute({
			requesterId: admin.id.toString(),
			employeeId: 'unknown',
		})

		expect(response.isLeft()).toBe(true)
		expect(response.value).toBeInstanceOf(NotFoundError)
	})
})
