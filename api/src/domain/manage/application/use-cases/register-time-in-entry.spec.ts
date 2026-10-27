import { makeEmployee } from '@test/factories/make-employee'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { InMemoryTimeBalanceEntryRepository } from '@test/repositories/repository/in-memory-time-balance-entry.repository'
import { InMemoryTimeBalanceRepository } from '@test/repositories/repository/in-memory-time-balance.repository'
import { InMemoryTimeEntryRepository } from '@test/repositories/repository/in-memory-time-entry.repository'
import { InMemoryWorkScheduleRepository } from '@test/repositories/repository/in-memory-work-schedule.repository'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { TimeEntry, TimeEntryStage } from '../../enterprise/entities/time-entry'
import { WorkSchedule } from '../../enterprise/entities/work-schedule'
import { RegisterTimeInEntryUseCase } from './register-time-in-entry'

dayjs.extend(utc)
dayjs.extend(timezone)

let inMemoryEmployeeRepository: InMemoryEmployeeRepository
let inMemoryTimeEntryRepository: InMemoryTimeEntryRepository
let inMemoryWorkScheduleRepository: InMemoryWorkScheduleRepository
let inMemoryTimeBalanceRepository: InMemoryTimeBalanceRepository
let inMemoryTimeBalanceEntryRepository: InMemoryTimeBalanceEntryRepository
let sut: RegisterTimeInEntryUseCase

describe('Register Time In Entry', () => {
	beforeEach(() => {
		inMemoryEmployeeRepository = new InMemoryEmployeeRepository()
		inMemoryTimeEntryRepository = new InMemoryTimeEntryRepository()
		inMemoryWorkScheduleRepository = new InMemoryWorkScheduleRepository()
		inMemoryTimeBalanceRepository = new InMemoryTimeBalanceRepository()
		inMemoryTimeBalanceEntryRepository = new InMemoryTimeBalanceEntryRepository(
			inMemoryTimeBalanceRepository,
		)

		sut = new RegisterTimeInEntryUseCase(
			inMemoryEmployeeRepository,
			inMemoryWorkScheduleRepository,
			inMemoryTimeEntryRepository,
			inMemoryTimeBalanceRepository,
			inMemoryTimeBalanceEntryRepository,
		)
	})

	it('should be able to "bater o ponto" when the user is an employee', async () => {
		const employee = makeEmployee()
		await inMemoryEmployeeRepository.create(employee)

		const workSchedule = WorkSchedule.create({
			breaksPerDay: 1,
			days: [1, 2, 3, 4, 5],
			endTime: '17:00',
			lateTolerance: 15,
			startTime: '09:00',
			employeeId: employee.id,
		})

		await inMemoryWorkScheduleRepository.create(workSchedule)

		const response = await sut.execute({
			clockIn: new Date(),
			requesterId: employee.id.toString(),
		})

		expect(response.isRight()).toBe(true)
		expect(response.value).toEqual({
			timeEntryId: expect.any(String),
		})
		expect(inMemoryTimeBalanceRepository.items).toHaveLength(1)
	})

	it("should not be able to 'bater o ponto' when the user already has an active time entry", async () => {
		const employee = makeEmployee()
		await inMemoryEmployeeRepository.create(employee)

		const workSchedule = WorkSchedule.create({
			breaksPerDay: 1,
			days: [1, 2, 3, 4, 5],
			endTime: '17:00',
			lateTolerance: 5,
			startTime: '09:00',
			employeeId: employee.id,
		})

		await inMemoryWorkScheduleRepository.create(workSchedule)

		const timeEntry = TimeEntry.create({
			breaks: [],
			clockIn: dayjs('2026-01-01').toDate(),
			status: TimeEntryStage.CLOCKED_IN,
			employeeId: employee.id,
		})

		await inMemoryTimeEntryRepository.create(timeEntry)
		const clockIn = dayjs.tz('2026-01-01 09:30', 'America/Fortaleza').toDate()

		const response = await sut.execute({
			clockIn,
			requesterId: employee.id.toString(),
		})

		expect(response.isLeft()).toBe(true)
		if (response.isLeft()) {
			expect(response.value.message).toEqual(
				'Already have an active time entry.',
			)
		}
	})

	it('should be able to hit the point when the user is an employee and is late, and should create a debit entry in the time balance', async () => {
		const employee = makeEmployee()
		await inMemoryEmployeeRepository.create(employee)

		const workSchedule = WorkSchedule.create({
			breaksPerDay: 1,
			days: [1, 2, 3, 4, 5],
			startTime: '09:00',
			endTime: '17:00',
			lateTolerance: 5,
			employeeId: employee.id,
		})

		await inMemoryWorkScheduleRepository.create(workSchedule)

		const clockIn = dayjs.tz('2026-01-01 09:30', 'America/Fortaleza').toDate()

		const response = await sut.execute({
			clockIn,
			requesterId: employee.id.toString(),
		})

		expect(response.isRight()).toBe(true)
		expect(response.value).toEqual({
			timeEntryId: expect.any(String),
		})
		expect(inMemoryTimeBalanceRepository.items).toHaveLength(1)
		expect(inMemoryTimeBalanceEntryRepository.items).toHaveLength(1)
		expect(inMemoryTimeBalanceEntryRepository.items[0]?.reason).toEqual(
			'LATE_ARRIVAL',
		)
		expect(inMemoryTimeBalanceEntryRepository.items[0]?.type).toEqual('DEBIT')
		expect(inMemoryTimeBalanceRepository.items[0]?.events).toHaveLength(1)
		expect(inMemoryTimeBalanceRepository.items[0]?.balanceMinutes).toBe(-30)
	})

	it('should be able to hit the point when the user is an employee and is early, and should create a credit entry in the time balance', async () => {
		const employee = makeEmployee()
		await inMemoryEmployeeRepository.create(employee)

		const workSchedule = WorkSchedule.create({
			breaksPerDay: 1,
			days: [1, 2, 3, 4, 5],
			startTime: '09:00',
			endTime: '17:00',
			lateTolerance: 5,
			employeeId: employee.id,
		})

		await inMemoryWorkScheduleRepository.create(workSchedule)

		const clockIn = dayjs.tz('2026-01-01 08:30', 'America/Fortaleza').toDate()

		const response = await sut.execute({
			clockIn,
			requesterId: employee.id.toString(),
		})

		expect(response.isRight()).toBe(true)
		expect(response.value).toEqual({
			timeEntryId: expect.any(String),
		})
		expect(inMemoryTimeBalanceRepository.items).toHaveLength(1)
		expect(inMemoryTimeBalanceEntryRepository.items).toHaveLength(1)
		expect(inMemoryTimeBalanceEntryRepository.items[0]?.reason).toEqual('EXTRA')
		expect(inMemoryTimeBalanceEntryRepository.items[0]?.type).toEqual('CREDIT')
		expect(inMemoryTimeBalanceRepository.items[0]?.events).toHaveLength(1)
		expect(inMemoryTimeBalanceRepository.items[0]?.balanceMinutes).toBe(30)
	})

	it('should be able to hit the point when the user is an employee and is early, and should create a credit entry in the time balance with reason COMPENSATION when the user has debt', async () => {
		const employee = makeEmployee()
		await inMemoryEmployeeRepository.create(employee)

		const workSchedule = WorkSchedule.create({
			breaksPerDay: 1,
			days: [1, 2, 3, 4, 5],
			startTime: '09:00',
			endTime: '17:00',
			lateTolerance: 5,
			employeeId: employee.id,
		})

		await inMemoryWorkScheduleRepository.create(workSchedule)

		const clockInLate = dayjs
			.tz('2026-01-01 09:30', 'America/Fortaleza')
			.toDate()

		const lateTimeEntryResponse = await sut.execute({
			clockIn: clockInLate,
			requesterId: employee.id.toString(),
		})

		const lateTimeEntryId =
			lateTimeEntryResponse.isRight() && lateTimeEntryResponse.value.timeEntryId

		const lateTimeEntry = await inMemoryTimeEntryRepository.findById(
			lateTimeEntryId.toString(),
		)

		lateTimeEntry!.clockOut = dayjs
			.tz('2026-01-01 17:00', 'America/Fortaleza')
			.toDate()

		await inMemoryTimeEntryRepository.update(lateTimeEntry!)

		const clockInEarly = dayjs
			.tz('2026-01-02 08:30', 'America/Fortaleza')
			.toDate()

		const response = await sut.execute({
			clockIn: clockInEarly,
			requesterId: employee.id.toString(),
		})

		expect(response.isRight()).toBe(true)
		expect(response.value).toEqual({
			timeEntryId: expect.any(String),
		})
		expect(inMemoryTimeBalanceRepository.items).toHaveLength(1)
		expect(inMemoryTimeBalanceEntryRepository.items).toHaveLength(2)
		expect(inMemoryTimeBalanceEntryRepository.items[1]?.reason).toEqual(
			'COMPENSATION',
		)
		expect(inMemoryTimeBalanceEntryRepository.items[1]?.type).toEqual('CREDIT')
		expect(inMemoryTimeBalanceRepository.items[0]?.events).toHaveLength(2)
		expect(inMemoryTimeBalanceRepository.items[0]?.balanceMinutes).toBe(0)
	})
})
