import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { makeEmployee } from '@test/factories/make-employee'
import { makeTimeEntry } from '@test/factories/make-time-entry'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { InMemoryTimeEntryRepository } from '@test/repositories/repository/in-memory-time-entry.repository'
import { TimeEntryStage } from '../../../enterprise/entities/time-entry'
import { UpdateEmployeeTimeEntryUseCase } from './update-employee-time-entry'

let employeeRepository: InMemoryEmployeeRepository
let timeEntryRepository: InMemoryTimeEntryRepository
let sut: UpdateEmployeeTimeEntryUseCase

describe('Update Employee Time Entry', () => {
	beforeEach(() => {
		employeeRepository = new InMemoryEmployeeRepository()
		timeEntryRepository = new InMemoryTimeEntryRepository()
		sut = new UpdateEmployeeTimeEntryUseCase(
			employeeRepository,
			timeEntryRepository,
		)
	})

	it('allows an admin to edit the start time and close an open entry', async () => {
		const admin = makeEmployee({ role: 'ADMIN' })
		const employee = makeEmployee()
		await employeeRepository.create(admin)
		await employeeRepository.create(employee)
		const entry = makeTimeEntry({
			employeeId: employee.id,
			clockIn: new Date('2026-01-02T12:00:00.000Z'),
			status: TimeEntryStage.CLOCKED_IN,
		})
		await timeEntryRepository.create(entry)

		const updateResponse = await sut.execute({
			requesterId: admin.id.toString(),
			employeeId: employee.id.toString(),
			timeEntryId: entry.id.toString(),
			clockIn: new Date('2026-01-02T12:15:00.000Z'),
		})
		const closeResponse = await sut.execute({
			requesterId: admin.id.toString(),
			employeeId: employee.id.toString(),
			timeEntryId: entry.id.toString(),
			clockOut: new Date('2026-01-02T20:00:00.000Z'),
		})

		expect(updateResponse.isRight()).toBe(true)
		expect(closeResponse.isRight()).toBe(true)
		expect(timeEntryRepository.items[0]?.clockIn).toEqual(
			new Date('2026-01-02T12:15:00.000Z'),
		)
		expect(timeEntryRepository.items[0]?.clockOut).toEqual(
			new Date('2026-01-02T20:00:00.000Z'),
		)
	})

	it('allows an admin to edit a closed entry with a future clock-out', async () => {
		const admin = makeEmployee({ role: 'ADMIN' })
		const employee = makeEmployee()
		await employeeRepository.create(admin)
		await employeeRepository.create(employee)
		const entry = makeTimeEntry({
			employeeId: employee.id,
			clockIn: new Date('2026-01-02T12:00:00.000Z'),
			clockOut: new Date('2026-01-02T20:00:00.000Z'),
			status: TimeEntryStage.CLOCKED_OUT,
		})
		await timeEntryRepository.create(entry)

		const futureClockOut = new Date('2099-01-02T20:00:00.000Z')
		const response = await sut.execute({
			requesterId: admin.id.toString(),
			employeeId: employee.id.toString(),
			timeEntryId: entry.id.toString(),
			clockOut: futureClockOut,
		})

		expect(response.isRight()).toBe(true)
		expect(timeEntryRepository.items[0]?.clockOut).toEqual(futureClockOut)
	})
})
