import { isAutomaticTimeBalanceEntryReason } from '../../../enterprise/entities/time-balance-entry'
import type { EmployeeRepository } from '../../repositories/employee.repository'
import type { TimeBalanceEntryRepository, AutomaticTimeBalanceEntry } from '../../repositories/time-balance-entry.repository'
import type { TimeBalanceRepository } from '../../repositories/time-balance.repository'
import type { TimeEntryJustificationRepository } from '../../repositories/time-entry-justification.repository'
import type { TimeEntryRepository } from '../../repositories/time-entry.repository'
import type { WorkScheduleRepository } from '../../repositories/work-schedule.repository'
import { calculateAutomaticTimeEntryBalance } from '../../services/calculate-automatic-time-entry-balance'

interface RecalculateEmployeeTimeBalanceRequest {
	employeeId: string
}

export class RecalculateEmployeeTimeBalanceUseCase {
	constructor(
		private readonly employeeRepository: EmployeeRepository,
		private readonly workScheduleRepository: WorkScheduleRepository,
		private readonly timeEntryRepository: TimeEntryRepository,
		private readonly timeBalanceRepository: TimeBalanceRepository,
		private readonly timeBalanceEntryRepository: TimeBalanceEntryRepository,
		private readonly timeEntryJustificationRepository: TimeEntryJustificationRepository,
	) {}

	async execute({ employeeId }: RecalculateEmployeeTimeBalanceRequest): Promise<void> {
		const employee = await this.employeeRepository.findById(employeeId)
		if (!employee) return

		const workSchedule = await this.workScheduleRepository.findByEmployeeId(employeeId)
		const timeBalance = await this.timeBalanceRepository.findByEmployeeId(employeeId)
		const manualBalance = timeBalance?.events
			.filter((entry) => !isAutomaticTimeBalanceEntryReason(entry.reason))
			.reduce(
				(total, entry) =>
					total +
					(entry.type === 'CREDIT'
						? entry.durationInMinutes
						: -entry.durationInMinutes),
				0,
			)
			?? 0

		if (!workSchedule) {
			await this.timeBalanceEntryRepository.replaceAutomaticEntries(employeeId, [])
			return
		}

		const timeEntries = await this.timeEntryRepository.findByEmployeeId(employeeId)
		const justifications = await this.timeEntryJustificationRepository.findByEmployeeId(employeeId)
		const justifiedTypesByTimeEntry = new Map<string, Set<'LATE_ARRIVAL' | 'EARLY_DEPARTURE'>>()
		for (const justification of justifications) {
			const types = justifiedTypesByTimeEntry.get(justification.timeEntryId.toString()) ?? new Set()
			types.add(justification.type)
			justifiedTypesByTimeEntry.set(justification.timeEntryId.toString(), types)
		}
		timeEntries.sort((first, second) => first.clockIn.getTime() - second.clockIn.getTime())

		let runningBalance = manualBalance
		const automaticEntries: AutomaticTimeBalanceEntry[] = []
		for (const timeEntry of timeEntries) {
			const calculatedEntries = calculateAutomaticTimeEntryBalance(
				timeEntry,
				workSchedule,
				runningBalance,
				{ justifiedTypes: justifiedTypesByTimeEntry.get(timeEntry.id.toString()) },
			)
			automaticEntries.push(...calculatedEntries)
			runningBalance += calculatedEntries.reduce(
				(total, entry) =>
					total +
					(entry.type === 'CREDIT'
						? entry.durationInMinutes
						: -entry.durationInMinutes),
				0,
			)
		}

		await this.timeBalanceEntryRepository.replaceAutomaticEntries(
			employeeId,
			automaticEntries,
		)
	}
}
