import type { WorkScheduleRepository } from '@src/domain/manage/application/repositories/work-schedule.repository'
import type { WorkSchedule } from '@src/domain/manage/enterprise/entities/work-schedule'

export class InMemoryWorkScheduleRepository implements WorkScheduleRepository {
	public items: WorkSchedule[] = []

	async create(workSchedule: WorkSchedule): Promise<void> {
		this.items.push(workSchedule)
	}

	async findById(id: string): Promise<WorkSchedule | null> {
		const workSchedule = this.items.find(
			(workSchedule) => workSchedule.id.toString() === id,
		)
		return workSchedule || null
	}

	async findByEmployeeId(employeeId: string): Promise<WorkSchedule | null> {
		const workSchedule = this.items.find(
			(workSchedule) => workSchedule.employeeId.toString() === employeeId,
		)
		return workSchedule || null
	}

	async update(workSchedule: WorkSchedule): Promise<void> {
		const index = this.items.findIndex(
			(ws) => ws.id.toString() === workSchedule.id.toString(),
		)
		if (index !== -1) {
			this.items[index] = workSchedule
		}
	}

	async delete(id: string): Promise<void> {
		const index = this.items.findIndex((ws) => ws.id.toString() === id)
		if (index !== -1) {
			this.items.splice(index, 1)
		}
	}
}
