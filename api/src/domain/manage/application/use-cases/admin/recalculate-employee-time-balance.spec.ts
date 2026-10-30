import { makeEmployee } from '@test/factories/make-employee'
import { makeTimeEntry } from '@test/factories/make-time-entry'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { InMemoryTimeBalanceEntryRepository } from '@test/repositories/repository/in-memory-time-balance-entry.repository'
import { InMemoryTimeBalanceRepository } from '@test/repositories/repository/in-memory-time-balance.repository'
import { InMemoryTimeEntryRepository } from '@test/repositories/repository/in-memory-time-entry.repository'
import { InMemoryTimeEntryJustificationRepository } from '@test/repositories/repository/in-memory-time-entry-justification.repository'
import { InMemoryWorkScheduleRepository } from '@test/repositories/repository/in-memory-work-schedule.repository'
import { TimeBalance } from '../../../enterprise/entities/time-balance'
import { TimeEntryStage } from '../../../enterprise/entities/time-entry'
import { WorkSchedule } from '../../../enterprise/entities/work-schedule'
import { RecalculateEmployeeTimeBalanceUseCase } from './recalculate-employee-time-balance'

describe('Recalculate Employee Time Balance', () => {
	it('replaces stale automatic entries after a time correction', async () => {
		const employeeRepository = new InMemoryEmployeeRepository()
		const workScheduleRepository = new InMemoryWorkScheduleRepository()
		const timeEntryRepository = new InMemoryTimeEntryRepository()
		const timeBalanceRepository = new InMemoryTimeBalanceRepository()
		const timeBalanceEntryRepository = new InMemoryTimeBalanceEntryRepository(
			timeBalanceRepository,
		)
		const timeEntryJustificationRepository = new InMemoryTimeEntryJustificationRepository()
		const employee = makeEmployee()
		await employeeRepository.create(employee)
		await workScheduleRepository.create(
			WorkSchedule.create({
				employeeId: employee.id,
				startTime: '09:00',
				endTime: '17:00',
				lateTolerance: 0,
				breaksPerDay: 1,
				days: [1, 2, 3, 4, 5],
			}),
		)
		await timeBalanceRepository.create(
			TimeBalance.create({ employeeId: employee.id }),
		)
		await timeBalanceEntryRepository.addDebitEntry(
			employee.id.toString(),
			15,
			'LATE_ARRIVAL',
		)
		await timeEntryRepository.create(
			makeTimeEntry({
				employeeId: employee.id,
				clockIn: new Date('2026-01-02T12:00:00.000Z'),
				clockOut: new Date('2026-01-02T19:00:00.000Z'),
				status: TimeEntryStage.CLOCKED_OUT,
			}),
		)

		const sut = new RecalculateEmployeeTimeBalanceUseCase(
			employeeRepository,
			workScheduleRepository,
			timeEntryRepository,
			timeBalanceRepository,
			timeBalanceEntryRepository,
			timeEntryJustificationRepository,
		)
		await sut.execute({ employeeId: employee.id.toString() })

		const balance = timeBalanceRepository.items[0]!
		expect(balance.balanceMinutes).toBe(-60)
		expect(balance.events).toHaveLength(1)
		expect(balance.events[0]?.reason).toBe('EARLY_DEPARTURE')
		expect(balance.events[0]?.durationInMinutes).toBe(60)
	})
})
