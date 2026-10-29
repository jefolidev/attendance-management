import type { PrismaClient } from "@prisma/client/extension";
import { WorkScheduleRepository } from "@src/domain/manage/application/repositories/work-schedule.repository";
import type { WorkSchedule as WorkScheduleDomain } from "@src/domain/manage/enterprise/entities/work-schedule";
import { PrismaWorkScheduleMapper } from "../../mappers/prisma-work-schedule.mapper";

export class PrismaWorkScheduleRepository implements WorkScheduleRepository {
    constructor(private readonly prisma: PrismaClient) {}
    
    async create(workSchedule: WorkScheduleDomain): Promise<void> {

      await this.prisma.workSchedule.create({
        data: {
            startTime: workSchedule.startTime,
            endTime: workSchedule.endTime,
            lateTolerance: workSchedule.lateTolerance,
            breaksPerDay: workSchedule.breaksPerDay,
            employeeId: workSchedule.employeeId.toString(),
            //TODO: Handle days relation
            }
        });
    }

    async findById(id: string): Promise<WorkScheduleDomain | null> {
      return await this.prisma.workSchedule.findUnique({
        where: { id }
      });
    }
    
    async findByEmployeeId(employeeId: string): Promise<WorkScheduleDomain | null> {
      const workSchedule = await this.prisma.workSchedule.findFirst({
        where: { employeeId }
      });

      return workSchedule ? PrismaWorkScheduleMapper.toDomain(workSchedule) : null;
    }

    async update(workSchedule: WorkScheduleDomain): Promise<void> {
        await this.prisma.workSchedule.update({
            where: { id: workSchedule.id },
            data: {
                ...workSchedule
            }
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.workSchedule.delete({
            where: { id }
        });
    }
}