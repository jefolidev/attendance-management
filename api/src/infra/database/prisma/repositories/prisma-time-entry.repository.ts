import type { TimeEntryRepository } from "@src/domain/manage/application/repositories/time-entry.repository";
import type { TimeEntry } from "@src/domain/manage/enterprise/entities/time-entry";

export class PrismaTimeEntryRepository implements TimeEntryRepository {
    async create(timeEntry: TimeEntry): Promise<void> {
        throw new Error("Método não implementado.");
    }
    async findById(id: string): Promise<TimeEntry | null> {
        throw new Error("Método não implementado.");
    }
    async findByEmployeeId(employeeId: string): Promise<TimeEntry[]> {
        throw new Error("Método não implementado.");
    }
    async findInProgressByEmployeeId(employeeId: string): Promise<TimeEntry | null> {
        throw new Error("Método não implementado.");
    }
    async findCompletedByEmployeeId(employeeId: string): Promise<TimeEntry[]> {
        throw new Error("Método não implementado.");
    }
    async update(timeEntry: TimeEntry): Promise<void> {
        throw new Error("Método não implementado.");
    }
    async delete(id: string): Promise<void> {
        throw new Error("Método não implementado.");
    }
  
}