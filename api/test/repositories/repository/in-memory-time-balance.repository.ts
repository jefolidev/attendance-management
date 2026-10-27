import type { PaginationParams } from '@src/core/repositories/pagination'
import type { TimeBalanceRepository } from '@src/domain/manage/application/repositories/time-balance.repository'
import type { TimeBalance } from '@src/domain/manage/enterprise/entities/time-balance'

export class InMemoryTimeBalanceRepository implements TimeBalanceRepository {
	public items: TimeBalance[] = []

	async create(timeBalance: TimeBalance): Promise<void> {
		this.items.push(timeBalance)
	}

	async findById(id: string): Promise<TimeBalance | null> {
		const timeBalance = this.items.find((item) => item.id.toString() === id)

		return timeBalance || null
	}

	async findManyByIdEmployeeId(
		employeeId: string,
		{ page }: PaginationParams,
	): Promise<TimeBalance[]> {
		const timeBalances = this.items
			.filter((item) => item.employeeId.toString() === employeeId)
			.slice((page - 1) * 20, page * 20)

		return timeBalances
	}

	async findByEmployeeId(employeeId: string): Promise<TimeBalance | null> {
		const timeBalance = this.items.find(
			(item) => item.employeeId.toString() === employeeId,
		)

		return timeBalance || null
	}

	async update(timeBalance: TimeBalance): Promise<void> {
		const index = this.items.findIndex(
			(item) => item.id.toString() === timeBalance.id.toString(),
		)
		if (index !== -1) {
			this.items[index] = timeBalance
		}
	}

	async delete(id: string): Promise<void> {
		const index = this.items.findIndex((item) => item.id.toString() === id)
		if (index !== -1) {
			this.items.splice(index, 1)
		}
	}
}
