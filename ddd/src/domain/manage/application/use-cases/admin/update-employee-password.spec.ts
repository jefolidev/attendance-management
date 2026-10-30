import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import { FakeHasher } from '@test/cryptography/fake-hasher'
import { makeEmployee } from '@test/factories/make-employee'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { UpdateEmployeePasswordUseCase } from './update-employee-password'

let employeeRepository: InMemoryEmployeeRepository
let hasher: FakeHasher
let sut: UpdateEmployeePasswordUseCase

describe('Update Employee Password', () => {
	beforeEach(() => {
		employeeRepository = new InMemoryEmployeeRepository()
		hasher = new FakeHasher()
		sut = new UpdateEmployeePasswordUseCase(employeeRepository, hasher)
	})

	it('updates a target password for an admin', async () => {
		const admin = makeEmployee({ role: 'ADMIN' })
		const employee = makeEmployee({ password: 'old-password' })
		await employeeRepository.create(admin)
		await employeeRepository.create(employee)

		const response = await sut.execute({
			requesterId: admin.id.toString(),
			employeeId: employee.id.toString(),
			password: 'new-password',
		})

		expect(response.isRight()).toBe(true)
		expect(employeeRepository.items[1]?.password).toBe('new-password-hashed')
	})

	it('does not allow a non-admin to update a password', async () => {
		const requester = makeEmployee()
		const employee = makeEmployee()
		await employeeRepository.create(requester)
		await employeeRepository.create(employee)

		const response = await sut.execute({
			requesterId: requester.id.toString(),
			employeeId: employee.id.toString(),
			password: 'new-password',
		})

		expect(response.isLeft()).toBe(true)
		expect(response.value).toBeInstanceOf(NotAllowedError)
	})

	it('validates password length and target existence', async () => {
		const admin = makeEmployee({ role: 'ADMIN' })
		await employeeRepository.create(admin)

		const invalidResponse = await sut.execute({
			requesterId: admin.id.toString(),
			employeeId: 'unknown',
			password: 'short',
		})
		const missingTargetResponse = await sut.execute({
			requesterId: admin.id.toString(),
			employeeId: 'unknown',
			password: 'valid-password',
		})

		expect(invalidResponse.isLeft()).toBe(true)
		expect(invalidResponse.value).toBeInstanceOf(BadRequestError)
		expect(missingTargetResponse.isLeft()).toBe(true)
		expect(missingTargetResponse.value).toBeInstanceOf(NotFoundError)
	})
})
