import { makeEmployee } from '@test/factories/make-employee'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { InMemoryTimeEntryRepository } from '@test/repositories/repository/in-memory-time-entry.repository'
import { InMemoryWorkScheduleRepository } from '@test/repositories/repository/in-memory-work-schedule.repository'
import dayjs from 'dayjs'
import { TimeEntry, TimeEntryStage } from '../../enterprise/entities/time-entry'
import { WorkSchedule } from '../../enterprise/entities/work-schedule'
import { RegisterTimeInEntryUseCase } from './register-time-in-entry'

let inMemoryEmployeeRepository: InMemoryEmployeeRepository
let inMemoryTimeEntryRepository: InMemoryTimeEntryRepository
let inMemoryWorkScheduleRepository: InMemoryWorkScheduleRepository
let sut: RegisterTimeInEntryUseCase

describe('Register Time In Entry', () => {
	beforeEach(() => {
		inMemoryEmployeeRepository = new InMemoryEmployeeRepository()
		inMemoryTimeEntryRepository = new InMemoryTimeEntryRepository()
		inMemoryWorkScheduleRepository = new InMemoryWorkScheduleRepository()
		sut = new RegisterTimeInEntryUseCase(
			inMemoryTimeEntryRepository,
			inMemoryEmployeeRepository,
			inMemoryWorkScheduleRepository,
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
	})

	it("should not be able to 'bater o ponto' when the user already has an active time entry", async () => {
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
			clockIn: dayjs('2026-01-01').toDate(),
			status: TimeEntryStage.CLOCKED_IN,
			employeeId: employee.id,
		})

		await inMemoryTimeEntryRepository.create(timeEntry)

		const response = await sut.execute({
			clockIn: dayjs('2026-01-02').toDate(),
			requesterId: employee.id.toString(),
		})

		expect(response.isLeft()).toBe(true)
		if (response.isLeft()) {
			expect(response.value.message).toEqual(
				'Already have an active time entry.',
			)
		}
	})
})
