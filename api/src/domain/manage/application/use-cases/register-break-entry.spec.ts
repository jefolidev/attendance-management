import { makeEmployee } from '@test/factories/make-employee'
import { makeTimeEntry } from '@test/factories/make-time-entry'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { InMemoryTimeEntryRepository } from '@test/repositories/repository/in-memory-time-entry.repository'
import { InMemoryWorkScheduleRepository } from '@test/repositories/repository/in-memory-work-schedule.repository'
import dayjs from 'dayjs'
import { TimeEntry, TimeEntryStage } from '../../enterprise/entities/time-entry'
import { WorkSchedule } from '../../enterprise/entities/work-schedule'
import { RegisterBreakEntryUseCase } from './register-break-entry'

let inMemoryEmployeeRepository: InMemoryEmployeeRepository
let inMemoryTimeEntryRepository: InMemoryTimeEntryRepository
let inMemoryWorkScheduleRepository: InMemoryWorkScheduleRepository
let sut: RegisterBreakEntryUseCase

describe('Register Time In Entry', () => {
	beforeEach(() => {
		inMemoryEmployeeRepository = new InMemoryEmployeeRepository()
		inMemoryTimeEntryRepository = new InMemoryTimeEntryRepository()
		inMemoryWorkScheduleRepository = new InMemoryWorkScheduleRepository()
		sut = new RegisterBreakEntryUseCase(
			inMemoryTimeEntryRepository,
			inMemoryEmployeeRepository,
			inMemoryWorkScheduleRepository,
		)
	})

	it('should be able to register a break', async () => {
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

		const timeEntry = TimeEntry.create({
			breaks: [],
			clockIn: new Date(),
			status: TimeEntryStage.CLOCKED_IN,
			employeeId: employee.id,
		})

		await inMemoryTimeEntryRepository.create(timeEntry)
		const response = await sut.execute({
			breakIn: new Date(),
			requesterId: employee.id.toString(),
		})

		expect(response.isRight()).toBe(true)
		expect(response.value).toEqual({
			timeEntryId: expect.any(String),
		})
		expect(inMemoryTimeEntryRepository.items[0]?.breaks).toHaveLength(1)
		expect(inMemoryTimeEntryRepository.items[0]?.status).toBe(
			TimeEntryStage.ON_BREAK,
		)
		expect(inMemoryTimeEntryRepository.items[0]?.breaks[0]?.end).toBe(null)
		expect(
			dayjs(inMemoryTimeEntryRepository.items[0]?.breaks[0]?.start).get(
				'minute',
			),
		).toBe(dayjs().get('minute'))
	})

	it('should be able to end a break', async () => {
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

		const timeEntry = TimeEntry.create({
			breaks: [
				{
					start: dayjs().subtract(15, 'minute').toDate(),
					end: null,
				},
			],
			clockIn: new Date(),
			status: TimeEntryStage.ON_BREAK,
			employeeId: employee.id,
		})

		await inMemoryTimeEntryRepository.create(timeEntry)
		const response = await sut.execute({
			breakIn: new Date(),
			requesterId: employee.id.toString(),
		})

		expect(response.isRight()).toBe(true)
		expect(response.value).toEqual({
			timeEntryId: expect.any(String),
		})
		expect(inMemoryTimeEntryRepository.items[0]?.breaks).toHaveLength(1)
		expect(inMemoryTimeEntryRepository.items[0]?.status).toBe(
			TimeEntryStage.CLOCKED_IN,
		)
		expect(
			dayjs(inMemoryTimeEntryRepository.items[0]?.breaks[0]?.end).get('minute'),
		).toBe(
			dayjs(inMemoryTimeEntryRepository.items[0]?.breaks[0]?.end).get('minute'),
		)
	})

	it('should not to be able to have more breaks than allowed', async () => {
		const employee = makeEmployee()
		await inMemoryEmployeeRepository.create(employee)

		const workSchedule = WorkSchedule.create({
			breaksPerDay: 2,
			days: [1, 2, 3, 4, 5],
			endTime: '17:00',
			lateTolerance: 15,
			startTime: '09:00',
			employeeId: employee.id,
		})

		await inMemoryWorkScheduleRepository.create(workSchedule)

		const breaksAlreadyTaken = makeTimeEntry({
			breaks: [
				{
					start: dayjs('2026-01-01T12:00:00').toDate(),
					end: dayjs('2026-01-01T13:00:00').toDate(),
				},
				{
					start: dayjs('2026-01-01T15:30:00').toDate(),
					end: dayjs('2026-01-01T16:00:00').toDate(),
				},
			],
			clockIn: new Date(),
			status: TimeEntryStage.CLOCKED_IN,
			employeeId: employee.id,
		})

		await inMemoryTimeEntryRepository.create(breaksAlreadyTaken)
		const response = await sut.execute({
			breakIn: new Date(),
			requesterId: employee.id.toString(),
		})

		expect(response.isLeft()).toBe(true)
		expect(inMemoryTimeEntryRepository.items[0]?.breaks).toHaveLength(2)

		if (response.isLeft()) {
			expect(response.value.message).toBe(
				'Maximum number of breaks reached for this employee.',
			)
		}
	})
})
