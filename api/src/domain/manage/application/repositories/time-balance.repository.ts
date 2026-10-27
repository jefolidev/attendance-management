import type { PaginationParams } from '@src/core/repositories/pagination'
import type { TimeBalance } from '../../enterprise/entities/time-balance'

export abstract class TimeBalanceRepository {
	abstract create(timeBalance: TimeBalance): Promise<void>
	abstract findById(id: string): Promise<TimeBalance | null>

	abstract findManyByIdEmployeeId(
		employeeId: string,
		paginationParams: PaginationParams,
	): Promise<TimeBalance[]>
	abstract findByEmployeeId(employeeId: string): Promise<TimeBalance | null>
	
	abstract update(timeBalance: TimeBalance): Promise<void>
	abstract delete(id: string): Promise<void>
}
