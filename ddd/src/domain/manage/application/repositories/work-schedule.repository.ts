import type { WorkSchedule } from "../../enterprise/entities/work-schedule";

export abstract class WorkScheduleRepository {
  abstract create(workSchedule: WorkSchedule): Promise<void>
  abstract findById(id: string): Promise<WorkSchedule | null>
  abstract findByEmployeeId(employeeId: string): Promise<WorkSchedule | null>
  abstract update(workSchedule: WorkSchedule): Promise<void>
  abstract delete(id: string): Promise<void>
}