import { makeEmployee } from '@test/factories/make-employee'
import { makeTimeEntry } from '@test/factories/make-time-entry'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { InMemoryTimeEntryRepository } from '@test/repositories/repository/in-memory-time-entry.repository'
import { InMemoryWorkScheduleRepository } from '@test/repositories/repository/in-memory-work-schedule.repository'
import { TimeEntryStage } from '../../enterprise/entities/time-entry'
import { WorkSchedule } from '../../enterprise/entities/work-schedule'
import { GetAccumulatedDelayTimeUseCase } from './get-accumulated-delay-time'

let inMemoryEmployeeRepository: InMemoryEmployeeRepository
let inMemoryWorkScheduleRepository: InMemoryWorkScheduleRepository
let inMemoryTimeEntryRepository: InMemoryTimeEntryRepository
let sut: GetAccumulatedDelayTimeUseCase

describe('Get Accumulated Delay Time', () => {
	beforeEach(() => {
		inMemoryEmployeeRepository = new InMemoryEmployeeRepository()
		inMemoryWorkScheduleRepository = new InMemoryWorkScheduleRepository()
		inMemoryTimeEntryRepository = new InMemoryTimeEntryRepository()
		sut = new GetAccumulatedDelayTimeUseCase(
			inMemoryEmployeeRepository,
			inMemoryWorkScheduleRepository,
			inMemoryTimeEntryRepository,
		)
	})

	it('should be able to list accumulated delay time from an employee', async () => {
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

		const dayAt = (daysAgo: number, hours: number, minutes: number) => {
			const date = new Date()
			date.setDate(date.getDate() - daysAgo)
			date.setHours(hours, minutes, 0, 0)
			return date
		}

		// 10 minutos de atraso, sem compensação no final do expediente.
		await inMemoryTimeEntryRepository.create(
			makeTimeEntry({
				employeeId: requester.id,
				clockIn: dayAt(1, 9, 10),
				clockOut: dayAt(1, 17, 0),
				status: TimeEntryStage.CLOCKED_OUT,
			}),
		)

		// 15 minutos de atraso, sem compensação no final do expediente.
		await inMemoryTimeEntryRepository.create(
			makeTimeEntry({
				employeeId: requester.id,
				clockIn: dayAt(2, 9, 15),
				clockOut: dayAt(2, 17, 0),
				status: TimeEntryStage.CLOCKED_OUT,
			}),
		)

		// Entrada no horário e 5 minutos trabalhados além do expediente.
		await inMemoryTimeEntryRepository.create(
			makeTimeEntry({
				employeeId: requester.id,
				clockIn: dayAt(3, 9, 0),
				clockOut: dayAt(3, 17, 5),
				status: TimeEntryStage.CLOCKED_OUT,
			}),
		)

		// 5 minutos de atraso compensados por 10 minutos a mais no expediente.
		await inMemoryTimeEntryRepository.create(
			makeTimeEntry({
				employeeId: requester.id,
				clockIn: dayAt(4, 9, 5),
				clockOut: dayAt(4, 17, 10),
				status: TimeEntryStage.CLOCKED_OUT,
			}),
		)

		// 20 minutos de atraso compensados por 15 minutos a mais no expediente.
		await inMemoryTimeEntryRepository.create(
			makeTimeEntry({
				employeeId: requester.id,
				clockIn: dayAt(5, 9, 20),
				clockOut: dayAt(5, 17, 15),
				status: TimeEntryStage.CLOCKED_OUT,
			}),
		)

		const response = await sut.execute({
			requesterId: requester.id.toString(),
		})

		expect(response.isRight()).toBe(true)

		if (response.isRight()) {
			expect(response.value.totalLateMinutes).toBe(50)
			expect(response.value.compensatedMinutes).toBe(20)
			expect(response.value.uncompensatedMinutes).toBe(20)
		}
	})
})
