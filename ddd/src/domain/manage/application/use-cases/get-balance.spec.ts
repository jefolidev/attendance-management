import { makeEmployee } from '@test/factories/make-employee'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { InMemoryTimeBalanceRepository } from '@test/repositories/repository/in-memory-time-balance.repository'
import { TimeBalance } from '../../enterprise/entities/time-balance'
import { GetBalanceUseCase } from './get-balance'

let inMemoryTimeBalanceRepository: InMemoryTimeBalanceRepository
let inMemoryEmployeeRepository: InMemoryEmployeeRepository
let sut: GetBalanceUseCase

describe('Get Employee Balance', () => {
	beforeEach(() => {
		inMemoryTimeBalanceRepository = new InMemoryTimeBalanceRepository()
		inMemoryEmployeeRepository = new InMemoryEmployeeRepository()
		sut = new GetBalanceUseCase(
			inMemoryEmployeeRepository,
			inMemoryTimeBalanceRepository,
		)
	})

	it('should be able to list employee time balance', async () => {
		const requester = makeEmployee({ role: 'EMPLOYEE' })
		await inMemoryEmployeeRepository.create(requester)

		const timeBalance = TimeBalance.create({
			employeeId: requester.id,
			balanceMinutes: 40,
			events: [],
		})

		await inMemoryTimeBalanceRepository.create(timeBalance)

		const response = await sut.execute({
			requesterId: requester.id.toString(),
		})

		expect(response.isRight()).toBe(true)
		expect(inMemoryTimeBalanceRepository.items).toHaveLength(1)
	})
})
