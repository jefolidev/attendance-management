import { makeEmployee } from '@test/factories/make-employee'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { InMemoryWorkScheduleRepository } from '@test/repositories/repository/in-memory-work-schedule.repository'
import { WorkSchedule } from '../../enterprise/entities/work-schedule'
import { UpdateWorkScheduleUseCase } from './update-work-schedule'

let inMemoryWorkScheduleRepository: InMemoryWorkScheduleRepository
let inMemoryEmployeeRepository: InMemoryEmployeeRepository
let sut: UpdateWorkScheduleUseCase

describe('Update WorkSchedule', () => {
	beforeEach(() => {
		inMemoryWorkScheduleRepository = new InMemoryWorkScheduleRepository()
		inMemoryEmployeeRepository = new InMemoryEmployeeRepository()
		sut = new UpdateWorkScheduleUseCase(
			inMemoryEmployeeRepository,
			inMemoryWorkScheduleRepository,
		)
	})

	it('should be able to update a workschedule', async () => {
		const requester = makeEmployee()
		await inMemoryEmployeeRepository.create(requester)

		const workSchedule = WorkSchedule.create({
			days: [1, 2, 3, 4, 5],
			startTime: '08:00',
			endTime: '17:00',
			lateTolerance: 10,
			breaksPerDay: 2,
			employeeId: requester.id,
		})

		await inMemoryWorkScheduleRepository.create(workSchedule)

		expect(inMemoryWorkScheduleRepository.items).toHaveLength(1)
		expect(inMemoryWorkScheduleRepository.items[0]?.employeeId).toBe(
			requester.id,
		)
		expect(inMemoryWorkScheduleRepository.items[0]?.startTime).toBe('08:00')
		expect(inMemoryWorkScheduleRepository.items[0]?.endTime).toBe('17:00')

		const response = await sut.execute({
			days: [1, 2, 3, 4, 5],
			startTime: '12:00',
			endTime: '14:00',
			lateTolerance: 5,
			breaksPerDay: 1,
			requesterId: requester.id.toString(),
		})

		expect(response.isRight()).toBe(true)
		expect(inMemoryWorkScheduleRepository.items).toHaveLength(1)
		expect(inMemoryWorkScheduleRepository.items[0]?.employeeId).toBe(
			requester.id,
		)
		expect(inMemoryWorkScheduleRepository.items[0]?.lateTolerance).toBe(5)
		expect(inMemoryWorkScheduleRepository.items[0]?.breaksPerDay).toBe(1)
		expect(inMemoryWorkScheduleRepository.items[0]?.startTime).toBe('12:00')
		expect(inMemoryWorkScheduleRepository.items[0]?.endTime).toBe('14:00')
	})
})
