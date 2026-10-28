import { WorkScheduleRepository } from "@src/domain/manage/application/repositories/work-schedule.repository";
import type { WorkSchedule } from "@src/domain/manage/enterprise/entities/work-schedule";
import { PrismaWorkScheduleMapper } from "../../mappers/prisma-work-schedule.mapper";

export class PrismaWorkScheduleRepository implements WorkScheduleRepository {
    constructor(private readonly prisma: any) {}
    
    async create(workSchedule: any): Promise<void> {
      await this.prisma.workSchedule.create({
        data: {
                ...workSchedule
            }
        });
    }

    async findById(id: string): Promise<any | null> {
      return await this.prisma.workSchedule.findUnique({
        where: { id }
      });
    }
    
    async findByEmployeeId(employeeId: string): Promise<WorkSchedule | null> {
      const workSchedule = await this.prisma.workSchedule.findFirst({
        where: { employeeId }
      });

      return workSchedule ? PrismaWorkScheduleMapper.toDomain(workSchedule) : null;
    }

    async update(workSchedule: any): Promise<void> {
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