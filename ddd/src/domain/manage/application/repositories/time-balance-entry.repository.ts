export abstract class TimeBalanceEntryRepository {
  abstract addDebitEntry(employeeId: string, amount: number, description: string): Promise<void>
  abstract addCreditEntry(employeeId: string, amount: number, description: string): Promise<void>
}