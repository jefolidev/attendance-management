import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import { makeEmployee } from '@test/factories/make-employee'
import { makeTimeEntry } from '@test/factories/make-time-entry'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { InMemoryTimeEntryRepository } from '@test/repositories/repository/in-memory-time-entry.repository'
import { InMemoryWorkScheduleRepository } from '@test/repositories/repository/in-memory-work-schedule.repository'
import { TimeEntryStage } from '../../../enterprise/entities/time-entry'
import { WorkSchedule } from '../../../enterprise/entities/work-schedule'
import { GetEmployeeDelaysUseCase } from './get-employee-delays'

dayjs.extend(utc)
dayjs.extend(timezone)

let employeeRepository: InMemoryEmployeeRepository
let timeEntryRepository: InMemoryTimeEntryRepository
let scheduleRepository: InMemoryWorkScheduleRepository
let sut: GetEmployeeDelaysUseCase

describe('Get Employee Delays', () => {
	beforeEach(() => {
		employeeRepository = new InMemoryEmployeeRepository()
		timeEntryRepository = new InMemoryTimeEntryRepository()
		scheduleRepository = new InMemoryWorkScheduleRepository()
		sut = new GetEmployeeDelaysUseCase(
			employeeRepository,
			scheduleRepository,
			timeEntryRepository,
		)
	})

	it('gets another employee delays for an admin', async () => {
		const admin = makeEmployee({ role: 'ADMIN' })
		const employee = makeEmployee()
		await employeeRepository.create(admin)
		await employeeRepository.create(employee)
		await scheduleRepository.create(
			WorkSchedule.create({
				employeeId: employee.id,
				startTime: '09:00',
				endTime: '17:00',
				lateTolerance: 5,
				breaksPerDay: 1,
				days: [0, 1, 2, 3, 4, 5, 6],
			}),
		)
		const yesterday = dayjs
			.tz('2026-01-02 09:20', 'America/Fortaleza')
			.subtract(1, 'day')
			.toDate()
		const end = dayjs
			.tz('2026-01-02 17:00', 'America/Fortaleza')
			.subtract(1, 'day')
			.toDate()
		await timeEntryRepository.create(
			makeTimeEntry({
				employeeId: employee.id,
				clockIn: yesterday,
				clockOut: end,
				status: TimeEntryStage.CLOCKED_OUT,
			}),
		)

		const response = await sut.execute({
			requesterId: admin.id.toString(),
			employeeId: employee.id.toString(),
		})

		expect(response.isRight()).toBe(true)
		if (response.isRight()) expect(response.value.totalLateMinutes).toBeGreaterThan(0)
	})

	it('does not allow a non-admin to inspect delays', async () => {
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
