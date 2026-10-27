import { makeEmployee } from '@test/factories/make-employee'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { InMemoryWorkScheduleRepository } from '@test/repositories/repository/in-memory-work-schedule.repository'
import { WorkSchedule } from '../../enterprise/entities/work-schedule'
import { GetWorkScheduleUseCase } from './get-work-schedule'

let inMemoryEmployeeRepository: InMemoryEmployeeRepository
let inMemoryWorkScheduleRepository: InMemoryWorkScheduleRepository
let sut: GetWorkScheduleUseCase

describe('List Work Schedule', () => {
	beforeEach(() => {
		inMemoryEmployeeRepository = new InMemoryEmployeeRepository()
		inMemoryWorkScheduleRepository = new InMemoryWorkScheduleRepository()
		sut = new GetWorkScheduleUseCase(
			inMemoryEmployeeRepository,
			inMemoryWorkScheduleRepository,
		)
	})

	it('should be able to list employee work schedule', async () => {
		const requester = makeEmployee({ role: 'EMPLOYEE' })
		await inMemoryEmployeeRepository.create(requester)

		const workSchedule = WorkSchedule.create({
			employeeId: requester.id,
			startTime: '09:00',
			endTime: '17:00',
			breaksPerDay: 1,
			days: [1, 2, 3, 4, 5],
			lateTolerance: 5,
		})

		await inMemoryWorkScheduleRepository.create(workSchedule)

		const response = await sut.execute({
			requesterId: requester.id.toString(),
		})

		expect(response.isRight()).toBe(true)
		expect(inMemoryWorkScheduleRepository.items[0]).toEqual(workSchedule)
	})
})
