import type { PrismaClient } from "@prisma/client/extension";
import type { TimeEntryRepository } from "@src/domain/manage/application/repositories/time-entry.repository";
import type { TimeEntry } from "@src/domain/manage/enterprise/entities/time-entry";
import { PrismaTimeEntryMapper } from "../../mappers/prisma-time-entry.mapper";

export class PrismaTimeEntryRepository implements TimeEntryRepository {
  constructor(private readonly prisma: PrismaClient) {}

    async create(timeEntry: TimeEntry): Promise<void> {
        await this.prisma.timeEntry.create({
            data: {
                id: timeEntry.id,
                employeeId: timeEntry.employeeId,
                clockIn: timeEntry.clockIn,
                clockOut: timeEntry.clockOut,
                updatedAt: timeEntry.updatedAt,
            },
        });
    }
    async findById(id: string): Promise<TimeEntry | null> {
        const timeEntry = await this.prisma.findUnique({
            where: { id },
        });
        
        return PrismaTimeEntryMapper.toDomain(timeEntry);
    }
    async findByEmployeeId(employeeId: string): Promise<TimeEntry[]> {
        const timeEntries = await this.prisma.timeEntry.findMany({
            where: { employeeId },
        });

        return timeEntries.map(PrismaTimeEntryMapper.toDomain);
    }
       
    async findInProgressByEmployeeId(employeeId: string): Promise<TimeEntry | null> {o
        const timeEntry = await this.prisma.timeEntry.findFirst({
            where: { employeeId, clockOut: { is: null } },
        })

        return PrismaTimeEntryMapper.toDomain(timeEntry);
    }

    async findCompletedByEmployeeId(employeeId: string): Promise<TimeEntry[]> {
        const timeEntries = await this.prisma.timeEntry.findMany({  
            where: { employeeId, clockOut: { not: null } },
        })

        return timeEntries.map(PrismaTimeEntryMapper.toDomain);
    }

    async update(timeEntry: TimeEntry): Promise<void> {
        await this.prisma.timeEntry.update({
            where: { id: timeEntry.id },
            data: {
                ...timeEntry
            },
        })
        
    }
    async delete(id: string): Promise<void> {
        await this.prisma.timeEntry.delete({
            where: { id },
        });
    }
}