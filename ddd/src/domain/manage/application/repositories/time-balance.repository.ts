import type { TimeBalance } from "../../enterprise/entities/time-balance";

export abstract class TimeBalanceRepository {
  abstract create(timeBalance: TimeBalance): Promise<void>
  abstract findById(id: string): Promise<TimeBalance | null>
  abstract findByEmployeeId(employeeId: string): Promise<TimeBalance | null>
  abstract update(timeBalance: TimeBalance): Promise<void>
  abstract delete(id: string): Promise<void>
}