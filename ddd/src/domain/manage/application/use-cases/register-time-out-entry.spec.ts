import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { makeEmployee } from '@test/factories/make-employee'
import { makeTimeEntry } from '@test/factories/make-time-entry'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { InMemoryTimeBalanceEntryRepository } from '@test/repositories/repository/in-memory-time-balance-entry.repository'
import { InMemoryTimeBalanceRepository } from '@test/repositories/repository/in-memory-time-balance.repository'
import { InMemoryTimeEntryRepository } from '@test/repositories/repository/in-memory-time-entry.repository'
import { InMemoryWorkScheduleRepository } from '@test/repositories/repository/in-memory-work-schedule.repository'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { TimeEntryStage } from '../../enterprise/entities/time-entry'
import { WorkSchedule } from '../../enterprise/entities/work-schedule'
import { RegisterTimeOutEntryUseCase } from './register-time-out-entry'

dayjs.extend(utc)
dayjs.extend(timezone)

let inMemoryEmployeeRepository: InMemoryEmployeeRepository
let inMemoryTimeEntryRepository: InMemoryTimeEntryRepository
let inMemoryWorkScheduleRepository: InMemoryWorkScheduleRepository
let inMemoryTimeBalanceRepository: InMemoryTimeBalanceRepository
let inMemoryTimeBalanceEntryRepository: InMemoryTimeBalanceEntryRepository
let sut: RegisterTimeOutEntryUseCase

describe('Register Time Out Entry', () => {
	beforeEach(() => {
		inMemoryEmployeeRepository = new InMemoryEmployeeRepository()
		inMemoryTimeEntryRepository = new InMemoryTimeEntryRepository()
		inMemoryWorkScheduleRepository = new InMemoryWorkScheduleRepository()
		inMemoryTimeBalanceRepository = new InMemoryTimeBalanceRepository()
		inMemoryTimeBalanceEntryRepository = new InMemoryTimeBalanceEntryRepository(
			inMemoryTimeBalanceRepository,
		)

		sut = new RegisterTimeOutEntryUseCase(
			inMemoryEmployeeRepository,
			inMemoryWorkScheduleRepository,
			inMemoryTimeEntryRepository,
			inMemoryTimeBalanceRepository,
			inMemoryTimeBalanceEntryRepository,
		)
	})

	it('should be able to "bater o ponto" to register a time out entry', async () => {
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

		const timeEntry = makeTimeEntry({
			employeeId: employee.id,
			breaks: [
				{
					start: dayjs().add(1, 'hour').toDate(),
					end: dayjs().add(2, 'hour').toDate(),
				},
			],
			clockIn: new Date(),
			status: TimeEntryStage.CLOCKED_IN,
		})

		await inMemoryTimeEntryRepository.create(timeEntry)

		const response = await sut.execute({
			clockOut: new Date(),
			requesterId: employee.id.toString(),
		})

		expect(response.isRight()).toBe(true)
		expect(response.value).toEqual({
			timeEntryId: expect.any(String),
		})
		expect(inMemoryTimeEntryRepository.items[0]?.status).toEqual(
			TimeEntryStage.CLOCKED_OUT,
		)
	})

	it('should not be able to break out if the employee has already broken out', async () => {
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

		const timeEntry = makeTimeEntry({
			employeeId: employee.id,
			breaks: [
				{
					start: dayjs().add(1, 'hour').toDate(),
					end: dayjs().add(2, 'hour').toDate(),
				},
			],
			clockIn: dayjs().subtract(10, 'hour').toDate(),
			clockOut: dayjs().subtract(1, 'hour').toDate(),
			status: TimeEntryStage.CLOCKED_OUT,
		})

		await inMemoryTimeEntryRepository.create(timeEntry)

		const response = await sut.execute({
			clockOut: new Date(),
			requesterId: employee.id.toString(),
		})

		expect(response.isLeft()).toBe(true)
		expect(response.value).toEqual(
			new BadRequestError('No active time entry found.'),
		)
	})

	it("should be able to add a debit entry to the employee's time balance if they leave early", async () => {
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

		const timeEntry = makeTimeEntry({
			employeeId: employee.id,
			breaks: [
				{
					start: dayjs().add(1, 'hour').toDate(),
					end: dayjs().add(2, 'hour').toDate(),
				},
			],
			clockIn: dayjs.tz('2026-01-01 09:00', 'America/Fortaleza').toDate(),
			status: TimeEntryStage.CLOCKED_IN,
		})

		await inMemoryTimeEntryRepository.create(timeEntry)
		const clockOut = dayjs.tz('2026-01-01 16:00', 'America/Fortaleza').toDate()

		const response = await sut.execute({
			clockOut,
			requesterId: employee.id.toString(),
		})
		expect(response.isRight()).toBe(true)
		expect(response.value).toEqual({
			timeEntryId: expect.any(String),
		})

		const timeBalanceEntries = await inMemoryTimeBalanceEntryRepository.items

		expect(timeBalanceEntries).toHaveLength(1)
		expect(timeBalanceEntries[0]?.type).toEqual('DEBIT')
		expect(timeBalanceEntries[0]?.durationInMinutes).toEqual(60)
	})

	it("should be able to finish a debt in the employee's time balance if they leave late", async () => {
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

		const timeEntry = makeTimeEntry({
			employeeId: employee.id,
			breaks: [
				{
					start: dayjs().add(1, 'hour').toDate(),
					end: dayjs().add(2, 'hour').toDate(),
				},
			],
			clockIn: dayjs.tz('2026-01-01 09:00', 'America/Fortaleza').toDate(),
			status: TimeEntryStage.CLOCKED_IN,
		})

		await inMemoryTimeEntryRepository.create(timeEntry)
		const clockOut = dayjs.tz('2026-01-01 18:00', 'America/Fortaleza').toDate()

		const response = await sut.execute({
			clockOut,
			requesterId: employee.id.toString(),
		})
		expect(response.isRight()).toBe(true)
		expect(response.value).toEqual({
			timeEntryId: expect.any(String),
		})

		const timeBalanceEntries = await inMemoryTimeBalanceEntryRepository.items

		expect(timeBalanceEntries).toHaveLength(1)
		expect(timeBalanceEntries[0]?.type).toEqual('CREDIT')
		expect(timeBalanceEntries[0]?.durationInMinutes).toEqual(60)
	})
})
