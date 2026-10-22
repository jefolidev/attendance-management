import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { makeEmployee } from '@test/factories/make-employee'
import { makeTimeEntry } from '@test/factories/make-time-entry'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { InMemoryTimeEntryRepository } from '@test/repositories/repository/in-memory-time-entry.repository'
import { InMemoryWorkScheduleRepository } from '@test/repositories/repository/in-memory-work-schedule.repository'
import dayjs from 'dayjs'
import { TimeEntryStage } from '../../enterprise/entities/time-entry'
import { WorkSchedule } from '../../enterprise/entities/work-schedule'
import { RegisterTimeOutEntryUseCase } from './register-time-out-entry'

let inMemoryEmployeeRepository: InMemoryEmployeeRepository
let inMemoryTimeEntryRepository: InMemoryTimeEntryRepository
let inMemoryWorkScheduleRepository: InMemoryWorkScheduleRepository
let sut: RegisterTimeOutEntryUseCase

describe('Register Time Out Entry', () => {
	beforeEach(() => {
		inMemoryEmployeeRepository = new InMemoryEmployeeRepository()
		inMemoryTimeEntryRepository = new InMemoryTimeEntryRepository()
		inMemoryWorkScheduleRepository = new InMemoryWorkScheduleRepository()
		sut = new RegisterTimeOutEntryUseCase(
			inMemoryTimeEntryRepository,
			inMemoryEmployeeRepository,
			inMemoryWorkScheduleRepository,
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
})
