export abstract class TimeCompensationRepository {
  abstract create(employeeId: string, amount: number, description: string): Promise<void>
  abstract findByEmployeeId(employeeId: string): Promise<{ amount: number, description: string }[]>
  abstract deleteByEmployeeId(employeeId: string): Promise<void>
}