import type { Prisma, PrismaClient } from "../../../../../generated/prisma/client.ts";
import { normalizePagination, type PaginationParams } from "@src/core/repositories/pagination";
import type { TimeEntryRepository } from "@src/domain/manage/application/repositories/time-entry.repository";
import type { TimeEntry } from "@src/domain/manage/enterprise/entities/time-entry";
import { PrismaTimeEntryMapper } from "../../mappers/prisma-time-entry.mapper";

export class PrismaTimeEntryRepository implements TimeEntryRepository {
  constructor(private readonly prisma: PrismaClient) {}

    async create(timeEntry: TimeEntry): Promise<void> {
        const data = PrismaTimeEntryMapper.toPrisma(timeEntry);

        await this.prisma.timeEntry.create({
            data: {
                ...data,
                breaks: JSON.parse(JSON.stringify(data.breaks)) as Prisma.InputJsonValue,
            },
        });
    }
    async findById(id: string): Promise<TimeEntry | null> {
        const timeEntry = await this.prisma.timeEntry.findUnique({
            where: { id },
        });
        
        return timeEntry ? PrismaTimeEntryMapper.toDomain(timeEntry) : null;
    }
    async findByEmployeeId(
        employeeId: string,
        paginationParams?: PaginationParams,
    ): Promise<TimeEntry[]> {
        const timeEntries = paginationParams
            ? await this.prisma.timeEntry.findMany({
                where: { employeeId },
                skip: (normalizePagination(paginationParams).page - 1) * normalizePagination(paginationParams).perPage,
                take: normalizePagination(paginationParams).perPage,
                orderBy: { clockIn: "desc" },
            })
            : await this.prisma.timeEntry.findMany({
                where: { employeeId },
            });

        return timeEntries.map(PrismaTimeEntryMapper.toDomain);
    }
       
    async findInProgressByEmployeeId(employeeId: string): Promise<TimeEntry | null> {
        const timeEntry = await this.prisma.timeEntry.findFirst({
            where: { employeeId, clockOut: null },
        })

        return timeEntry ? PrismaTimeEntryMapper.toDomain(timeEntry) : null;
    }

    async findCompletedByEmployeeId(employeeId: string): Promise<TimeEntry[]> {
        const timeEntries = await this.prisma.timeEntry.findMany({  
            where: { employeeId, clockOut: { not: null } },
        })

        return timeEntries.map(PrismaTimeEntryMapper.toDomain);
    }

    async update(timeEntry: TimeEntry): Promise<void> {
        const data = PrismaTimeEntryMapper.toPrisma(timeEntry);

        await this.prisma.timeEntry.update({
            where: { id: timeEntry.id.toString() },
            data: {
                employeeId: data.employeeId,
                clockIn: data.clockIn,
                clockOut: data.clockOut,
                breaks: JSON.parse(JSON.stringify(data.breaks)) as Prisma.InputJsonValue,
                status: data.status,
                updatedAt: data.updatedAt,
            },
        })
        
    }
    async delete(id: string): Promise<void> {
        await this.prisma.timeEntry.delete({
            where: { id },
        });
    }
}
