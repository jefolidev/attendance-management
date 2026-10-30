import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import { makeEmployee } from '@test/factories/make-employee'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { InMemoryWorkScheduleRepository } from '@test/repositories/repository/in-memory-work-schedule.repository'
import { WorkSchedule } from '../../../enterprise/entities/work-schedule'
import { UpdateEmployeeWorkScheduleUseCase } from './update-employee-work-schedule'

let employeeRepository: InMemoryEmployeeRepository
let scheduleRepository: InMemoryWorkScheduleRepository
let sut: UpdateEmployeeWorkScheduleUseCase

describe('Update Employee Work Schedule', () => {
	beforeEach(() => {
		employeeRepository = new InMemoryEmployeeRepository()
		scheduleRepository = new InMemoryWorkScheduleRepository()
		sut = new UpdateEmployeeWorkScheduleUseCase(
			employeeRepository,
			scheduleRepository,
		)
	})

	it('updates a target schedule for an admin', async () => {
		const admin = makeEmployee({ role: 'ADMIN' })
		const employee = makeEmployee()
		await employeeRepository.create(admin)
		await employeeRepository.create(employee)
		await scheduleRepository.create(
			WorkSchedule.create({
				employeeId: employee.id,
				startTime: '09:00',
				endTime: '17:00',
				lateTolerance: 10,
				breaksPerDay: 1,
				days: [1, 2, 3, 4, 5],
			}),
		)

		const response = await sut.execute({
			requesterId: admin.id.toString(),
			employeeId: employee.id.toString(),
			startTime: '08:30',
			endTime: '16:30',
			lateTolerance: 5,
			breaksPerDay: 2,
			days: [1, 2, 3, 4, 5],
		})

		expect(response.isRight()).toBe(true)
		expect(scheduleRepository.items[0]).toMatchObject({
			startTime: '08:30',
			endTime: '16:30',
			lateTolerance: 5,
			breaksPerDay: 2,
		})
	})

	it('rejects invalid schedule fields', async () => {
		const admin = makeEmployee({ role: 'ADMIN' })
		const employee = makeEmployee()
		await employeeRepository.create(admin)
		await employeeRepository.create(employee)

		const response = await sut.execute({
			requesterId: admin.id.toString(),
			employeeId: employee.id.toString(),
			startTime: '18:00',
			endTime: '08:00',
			days: [1, 1],
		})

		expect(response.isLeft()).toBe(true)
		expect(response.value).toBeInstanceOf(BadRequestError)
	})

	it('requires an admin and an existing schedule', async () => {
		const requester = makeEmployee()
		const admin = makeEmployee({ role: 'ADMIN' })
		const employee = makeEmployee()
		await employeeRepository.create(requester)
		await employeeRepository.create(admin)
		await employeeRepository.create(employee)

		const notAllowedResponse = await sut.execute({
			requesterId: requester.id.toString(),
			employeeId: employee.id.toString(),
			startTime: '08:00',
		})
		const missingScheduleResponse = await sut.execute({
			requesterId: admin.id.toString(),
			employeeId: employee.id.toString(),
			startTime: '08:00',
		})

		expect(notAllowedResponse.isLeft()).toBe(true)
		expect(notAllowedResponse.value).toBeInstanceOf(NotAllowedError)
		expect(missingScheduleResponse.isLeft()).toBe(true)
		expect(missingScheduleResponse.value).toBeInstanceOf(NotFoundError)
	})
})
