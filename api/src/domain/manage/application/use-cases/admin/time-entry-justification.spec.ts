import { makeEmployee } from '@test/factories/make-employee'
import { makeTimeEntry } from '@test/factories/make-time-entry'
import { InMemoryEmployeeRepository } from '@test/repositories/repository/in-memory-employee.repository'
import { InMemoryTimeBalanceEntryRepository } from '@test/repositories/repository/in-memory-time-balance-entry.repository'
import { InMemoryTimeBalanceRepository } from '@test/repositories/repository/in-memory-time-balance.repository'
import { InMemoryTimeEntryJustificationRepository } from '@test/repositories/repository/in-memory-time-entry-justification.repository'
import { InMemoryTimeEntryRepository } from '@test/repositories/repository/in-memory-time-entry.repository'
import { InMemoryWorkScheduleRepository } from '@test/repositories/repository/in-memory-work-schedule.repository'
import { TimeBalance } from '../../../enterprise/entities/time-balance'
import { TimeEntryStage } from '../../../enterprise/entities/time-entry'
import { RecalculateEmployeeTimeBalanceUseCase } from './recalculate-employee-time-balance'
import { CreateTimeEntryJustificationUseCase } from './create-time-entry-justification'
import { RemoveTimeEntryJustificationUseCase } from './remove-time-entry-justification'
import { WorkSchedule } from '../../../enterprise/entities/work-schedule'

describe('Time Entry Justification', () => {
	function makeScenario() {
		const employeeRepository = new InMemoryEmployeeRepository()
		const workScheduleRepository = new InMemoryWorkScheduleRepository()
		const timeEntryRepository = new InMemoryTimeEntryRepository()
		const timeBalanceRepository = new InMemoryTimeBalanceRepository()
		const timeBalanceEntryRepository = new InMemoryTimeBalanceEntryRepository(timeBalanceRepository)
		const justificationRepository = new InMemoryTimeEntryJustificationRepository()
		const recalculate = new RecalculateEmployeeTimeBalanceUseCase(
			employeeRepository,
			workScheduleRepository,
			timeEntryRepository,
			timeBalanceRepository,
			timeBalanceEntryRepository,
			justificationRepository,
		)

		return {
			employeeRepository,
			workScheduleRepository,
			timeEntryRepository,
			timeBalanceRepository,
			justificationRepository,
			recalculate,
		}
	}

	it('removes the automatic late-arrival debt and restores it when removed', async () => {
		const scenario = makeScenario()
		const admin = makeEmployee({ role: 'ADMIN' })
		const employee = makeEmployee()
		await scenario.employeeRepository.create(admin)
		await scenario.employeeRepository.create(employee)
		await scenario.workScheduleRepository.create(WorkSchedule.create({
			employeeId: employee.id,
			startTime: '09:00',
			endTime: '17:00',
			lateTolerance: 0,
			breaksPerDay: 1,
			days: [1, 2, 3, 4, 5],
		}))
		await scenario.timeBalanceRepository.create(TimeBalance.create({ employeeId: employee.id }))
		const entry = makeTimeEntry({
			employeeId: employee.id,
			clockIn: new Date('2026-01-02T12:30:00.000Z'),
			clockOut: new Date('2026-01-02T20:00:00.000Z'),
			status: TimeEntryStage.CLOCKED_OUT,
		})
		await scenario.timeEntryRepository.create(entry)
		await scenario.recalculate.execute({ employeeId: employee.id.toString() })

		const create = new CreateTimeEntryJustificationUseCase(
			scenario.employeeRepository,
			scenario.timeEntryRepository,
			scenario.justificationRepository,
			scenario.recalculate,
		)
		const created = await create.execute({
			requesterId: admin.id.toString(),
			employeeId: employee.id.toString(),
			timeEntryId: entry.id.toString(),
			type: 'LATE_ARRIVAL',
			category: 'MEDICAL_EMERGENCY',
		})

		expect(created.isRight()).toBe(true)
		expect(scenario.timeBalanceRepository.items[0]?.balanceMinutes).toBe(0)

		const remove = new RemoveTimeEntryJustificationUseCase(
			scenario.employeeRepository,
			scenario.timeEntryRepository,
			scenario.justificationRepository,
			scenario.recalculate,
		)
		await remove.execute({
			requesterId: admin.id.toString(),
			employeeId: employee.id.toString(),
			timeEntryId: entry.id.toString(),
			type: 'LATE_ARRIVAL',
		})

		expect(scenario.timeBalanceRepository.items[0]?.balanceMinutes).toBe(-30)
	})

	it('requires a closed entry before justifying an early departure', async () => {
		const scenario = makeScenario()
		const admin = makeEmployee({ role: 'ADMIN' })
		const employee = makeEmployee()
		await scenario.employeeRepository.create(admin)
		await scenario.employeeRepository.create(employee)
		await scenario.workScheduleRepository.create(WorkSchedule.create({
			employeeId: employee.id,
			startTime: '09:00',
			endTime: '17:00',
			lateTolerance: 0,
			breaksPerDay: 1,
			days: [1, 2, 3, 4, 5],
		}))
		await scenario.timeBalanceRepository.create(TimeBalance.create({ employeeId: employee.id }))
		const entry = makeTimeEntry({ employeeId: employee.id, clockIn: new Date('2026-01-02T12:00:00.000Z') })
		await scenario.timeEntryRepository.create(entry)

		const create = new CreateTimeEntryJustificationUseCase(
			scenario.employeeRepository,
			scenario.timeEntryRepository,
			scenario.justificationRepository,
			scenario.recalculate,
		)
		const result = await create.execute({
			requesterId: admin.id.toString(),
			employeeId: employee.id.toString(),
			timeEntryId: entry.id.toString(),
			type: 'EARLY_DEPARTURE',
			category: 'MEDICAL_EMERGENCY',
		})

		expect(result.isLeft()).toBe(true)
		expect(scenario.justificationRepository.items).toHaveLength(0)
	})
})
