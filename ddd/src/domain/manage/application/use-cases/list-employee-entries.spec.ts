import { makeEmployee } from '@test/factories/make-employee'
import { makeTimeEntry } from '@test/factories/make-time-entry'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { InMemoryTimeEntryRepository } from '@test/repositories/repository/in-memory-time-entry.repository'
import { InMemoryWorkScheduleRepository } from '@test/repositories/repository/in-memory-work-schedule.repository'
import { TimeEntryStage } from '../../enterprise/entities/time-entry'
import { WorkSchedule } from '../../enterprise/entities/work-schedule'
import { ListEmployeeEntriesUseCase } from './list-employee-entries'

let inMemoryEmployeeRepository: InMemoryEmployeeRepository
let inMemoryWorkScheduleRepository: InMemoryWorkScheduleRepository
let inMemoryTimeEntryRepository: InMemoryTimeEntryRepository
let sut: ListEmployeeEntriesUseCase

describe('List Employee Entries', () => {
	beforeEach(() => {
		inMemoryEmployeeRepository = new InMemoryEmployeeRepository()
		inMemoryWorkScheduleRepository = new InMemoryWorkScheduleRepository()
		inMemoryTimeEntryRepository = new InMemoryTimeEntryRepository()
		sut = new ListEmployeeEntriesUseCase(
			inMemoryEmployeeRepository,
			inMemoryWorkScheduleRepository,
			inMemoryTimeEntryRepository,
		)
	})

	it('should be able to list employee entries', async () => {
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

		const todayAt = (hours: number, minutes: number) => {
			const date = new Date()
			date.setHours(hours, minutes, 0, 0)
			return date
		}

		// Expediente encerrado: entrada adiantada, pausa completa e saída atrasada.
		await inMemoryTimeEntryRepository.create(
			makeTimeEntry({
				employeeId: requester.id,
				clockIn: todayAt(8, 45),
				clockOut: todayAt(17, 30),
				breaks: [
					{
						start: todayAt(12, 0),
						end: todayAt(13, 0),
					},
				],
				status: TimeEntryStage.CLOCKED_OUT,
			}),
		)

		// Expediente encerrado: entrada atrasada, pausa completa e saída antecipada.
		await inMemoryTimeEntryRepository.create(
			makeTimeEntry({
				employeeId: requester.id,
				clockIn: todayAt(9, 20),
				clockOut: todayAt(16, 40),
				breaks: [
					{
						start: todayAt(12, 30),
						end: todayAt(13, 30),
					},
				],
				status: TimeEntryStage.CLOCKED_OUT,
			}),
		)

		// Expediente encerrado exatamente no horário previsto e sem pausa registrada.
		await inMemoryTimeEntryRepository.create(
			makeTimeEntry({
				employeeId: requester.id,
				clockIn: todayAt(9, 0),
				clockOut: todayAt(17, 0),
				status: TimeEntryStage.CLOCKED_OUT,
			}),
		)

		// Expediente ainda aberto, sem saída registrada.
		await inMemoryTimeEntryRepository.create(
			makeTimeEntry({
				employeeId: requester.id,
				clockIn: todayAt(9, 10),
				clockOut: todayAt(16, 50),
				status: TimeEntryStage.CLOCKED_OUT,
			}),
		)

		// Funcionário em pausa, com a saída da pausa ainda pendente.
		await inMemoryTimeEntryRepository.create(
			makeTimeEntry({
				employeeId: requester.id,
				clockIn: todayAt(8, 55),
				status: TimeEntryStage.ON_BREAK,
				breaks: [{ start: todayAt(12, 0), end: null }],
			}),
		)

		const response = await sut.execute({
			requesterId: requester.id.toString(),
		})

		expect(response.isRight()).toBe(true)

		if (response.isRight()) {
			expect(response.value.entries).toHaveLength(5)
			expect(
				response.value.entries.map(
					(entry) => Object.values(entry)[0]?.timeEntryStage,
				),
			).toEqual([
				TimeEntryStage.CLOCKED_OUT,
				TimeEntryStage.CLOCKED_OUT,
				TimeEntryStage.CLOCKED_OUT,
				TimeEntryStage.CLOCKED_OUT,
				TimeEntryStage.ON_BREAK,
			])
		}
	})
})
