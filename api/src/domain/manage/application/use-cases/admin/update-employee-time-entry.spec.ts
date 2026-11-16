import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { makeEmployee } from '@test/factories/make-employee'
import { makeTimeEntry } from '@test/factories/make-time-entry'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { InMemoryTimeBalanceEntryRepository } from '@test/repositories/repository/in-memory-time-balance-entry.repository'
import { InMemoryTimeBalanceRepository } from '@test/repositories/repository/in-memory-time-balance.repository'
import { InMemoryTimeEntryRepository } from '@test/repositories/repository/in-memory-time-entry.repository'
import { InMemoryTimeEntryJustificationRepository } from '@test/repositories/repository/in-memory-time-entry-justification.repository'
import { InMemoryWorkScheduleRepository } from '@test/repositories/repository/in-memory-work-schedule.repository'
import { TimeBalance } from '../../../enterprise/entities/time-balance'
import { TimeEntryStage } from '../../../enterprise/entities/time-entry'
import { WorkSchedule } from '../../../enterprise/entities/work-schedule'
import { UpdateEmployeeTimeEntryUseCase } from './update-employee-time-entry'

let employeeRepository: InMemoryEmployeeRepository
let timeEntryRepository: InMemoryTimeEntryRepository
	let timeBalanceRepository: InMemoryTimeBalanceRepository
	let timeBalanceEntryRepository: InMemoryTimeBalanceEntryRepository
	let workScheduleRepository: InMemoryWorkScheduleRepository
	let timeEntryJustificationRepository: InMemoryTimeEntryJustificationRepository
let sut: UpdateEmployeeTimeEntryUseCase

describe('Update Employee Time Entry', () => {
	beforeEach(() => {
		employeeRepository = new InMemoryEmployeeRepository()
		timeEntryRepository = new InMemoryTimeEntryRepository()
		timeBalanceRepository = new InMemoryTimeBalanceRepository()
		timeBalanceEntryRepository = new InMemoryTimeBalanceEntryRepository(timeBalanceRepository)
		workScheduleRepository = new InMemoryWorkScheduleRepository()
		timeEntryJustificationRepository = new InMemoryTimeEntryJustificationRepository()
		sut = new UpdateEmployeeTimeEntryUseCase(
			employeeRepository,
			timeEntryRepository,
			workScheduleRepository,
			timeBalanceRepository,
			timeBalanceEntryRepository,
			timeEntryJustificationRepository,
		)
	})

	it('allows an admin to edit the start time of an open entry', async () => {
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

		const response = await sut.execute({
			requesterId: admin.id.toString(),
			employeeId: employee.id.toString(),
			timeEntryId: entry.id.toString(),
			clockIn: new Date('2026-01-02T12:15:00.000Z'),
		})

		expect(response.isRight()).toBe(true)
		expect(timeEntryRepository.items[0]?.clockIn).toEqual(
			new Date('2026-01-02T12:15:00.000Z'),
		)
		expect(timeEntryRepository.items[0]?.clockOut).toBeUndefined()
	})

	it('recalculates a stale late-arrival entry after correcting the clock-in', async () => {
		const admin = makeEmployee({ role: 'ADMIN' })
		const employee = makeEmployee()
		await employeeRepository.create(admin)
		await employeeRepository.create(employee)
		await workScheduleRepository.create(
			WorkSchedule.create({
				employeeId: employee.id,
				startTime: '08:00',
				endTime: '17:00',
				lateTolerance: 5,
				breaksPerDay: 1,
				days: [5],
			}),
		)
		await timeBalanceRepository.create(
			TimeBalance.create({ employeeId: employee.id }),
		)

		const originalClockIn = new Date('2026-01-02T11:37:00.000Z')
		const entry = makeTimeEntry({
			employeeId: employee.id,
			clockIn: originalClockIn,
			status: TimeEntryStage.CLOCKED_IN,
		})
		await timeEntryRepository.create(entry)
		await timeBalanceEntryRepository.replaceAutomaticEntries(
			employee.id.toString(),
			[
				{
					type: 'DEBIT',
					reason: 'LATE_ARRIVAL',
					durationInMinutes: 37,
					createdAt: originalClockIn,
				},
			],
		)

		const response = await sut.execute({
			requesterId: admin.id.toString(),
			employeeId: employee.id.toString(),
			timeEntryId: entry.id.toString(),
			clockIn: new Date('2026-01-02T11:05:00.000Z'),
		})

		expect(response.isRight()).toBe(true)
		expect(timeBalanceRepository.items[0]?.balanceMinutes).toBe(0)
		expect(timeBalanceRepository.items[0]?.events).toHaveLength(0)
		expect(timeBalanceEntryRepository.items).toHaveLength(0)
	})

	it('allows defining the end time of an open entry and editing a closed entry', async () => {
		const admin = makeEmployee({ role: 'ADMIN' })
		const employee = makeEmployee()
		await employeeRepository.create(admin)
		await employeeRepository.create(employee)
		const openEntry = makeTimeEntry({
			employeeId: employee.id,
			clockIn: new Date('2026-01-02T12:00:00.000Z'),
			status: TimeEntryStage.CLOCKED_IN,
		})
		await timeEntryRepository.create(openEntry)

		const openResponse = await sut.execute({
			requesterId: admin.id.toString(),
			employeeId: employee.id.toString(),
			timeEntryId: openEntry.id.toString(),
			clockOut: new Date('2026-01-02T20:00:00.000Z'),
		})
		expect(openResponse.isRight()).toBe(true)
		expect(timeEntryRepository.items[0]?.clockOut).toEqual(
			new Date('2026-01-02T20:00:00.000Z'),
		)

		const closedEntry = makeTimeEntry({
			employeeId: employee.id,
			clockIn: new Date('2026-01-02T12:00:00.000Z'),
			clockOut: new Date('2026-01-02T20:00:00.000Z'),
			status: TimeEntryStage.CLOCKED_OUT,
		})
		await timeEntryRepository.create(closedEntry)

		const futureClockOut = new Date('2099-01-02T19:45:00.000Z')
		const closedResponse = await sut.execute({
			requesterId: admin.id.toString(),
			employeeId: employee.id.toString(),
			timeEntryId: closedEntry.id.toString(),
			clockOut: futureClockOut,
		})
		expect(closedResponse.isRight()).toBe(true)
		expect(timeEntryRepository.items[1]?.clockOut).toEqual(futureClockOut)
	})

	it('rejects non-admins and invalid time ranges', async () => {
		const requester = makeEmployee()
		const admin = makeEmployee({ role: 'ADMIN' })
		const employee = makeEmployee()
		await employeeRepository.create(requester)
		await employeeRepository.create(admin)
		await employeeRepository.create(employee)
		const entry = makeTimeEntry({
			employeeId: employee.id,
			clockIn: new Date('2026-01-02T12:00:00.000Z'),
			clockOut: new Date('2026-01-02T20:00:00.000Z'),
			status: TimeEntryStage.CLOCKED_OUT,
		})
		await timeEntryRepository.create(entry)

		const notAllowedResponse = await sut.execute({
			requesterId: requester.id.toString(),
			employeeId: employee.id.toString(),
			timeEntryId: entry.id.toString(),
			clockIn: new Date('2026-01-02T13:00:00.000Z'),
		})
		expect(notAllowedResponse.isLeft()).toBe(true)
		expect(notAllowedResponse.value).toBeInstanceOf(NotAllowedError)

		const invalidRangeResponse = await sut.execute({
			requesterId: admin.id.toString(),
			employeeId: employee.id.toString(),
			timeEntryId: entry.id.toString(),
			clockIn: new Date('2026-01-02T21:00:00.000Z'),
		})
		expect(invalidRangeResponse.isLeft()).toBe(true)
		expect(invalidRangeResponse.value).toBeInstanceOf(BadRequestError)
	})
})
