import type { PrismaClient } from "../../../../../generated/prisma/client.ts";
import { WorkScheduleRepository } from "@src/domain/manage/application/repositories/work-schedule.repository";
import type { WorkSchedule as WorkScheduleDomain } from "@src/domain/manage/enterprise/entities/work-schedule";
import { PrismaWorkScheduleMapper } from "../../mappers/prisma-work-schedule.mapper";

export class PrismaWorkScheduleRepository implements WorkScheduleRepository {
    constructor(private readonly prisma: PrismaClient) {}
    
    async create(workSchedule: WorkScheduleDomain): Promise<void> {
      await this.prisma.workSchedule.create({
        data: {
          ...PrismaWorkScheduleMapper.toPrisma(workSchedule),
          workDaysWorkSchedules: {
            create: {
              workDays: {
                create: PrismaWorkScheduleMapper.toWorkDaysPrisma(workSchedule),
              },
            },
          },
        },
      });
    }

    async findById(id: string): Promise<WorkScheduleDomain | null> {
      const workSchedule = await this.prisma.workSchedule.findUnique({
        where: { id },
        include: {
          workDaysWorkSchedules: {
            include: { workDays: true },
          },
        },
      });

      return workSchedule ? PrismaWorkScheduleMapper.toDomain(workSchedule) : null;
    }
    
    async findByEmployeeId(employeeId: string): Promise<WorkScheduleDomain | null> {
      const workSchedule = await this.prisma.workSchedule.findFirst({
        where: { employeeId },
        include: {
          workDaysWorkSchedules: {
            include: { workDays: true },
          },
        },
      });

      return workSchedule ? PrismaWorkScheduleMapper.toDomain(workSchedule) : null;
    }

    async update(workSchedule: WorkScheduleDomain): Promise<void> {
        await this.prisma.$transaction(async (transaction) => {
          await transaction.workSchedule.update({
            where: { id: workSchedule.id.toString() },
            data: {
              startTime: workSchedule.startTime,
              endTime: workSchedule.endTime,
              lateTolerance: workSchedule.lateTolerance,
              breaksPerDay: workSchedule.breaksPerDay,
            },
          });

          const relation = await transaction.workDaysWorkSchedule.findFirst({
            where: { workScheduleId: workSchedule.id.toString() },
          });

          if (relation) {
            await transaction.workDays.update({
              where: { id: relation.workDaysId },
              data: PrismaWorkScheduleMapper.toWorkDaysPrisma(workSchedule),
            });
          } else {
            await transaction.workSchedule.update({
              where: { id: workSchedule.id.toString() },
              data: {
                workDaysWorkSchedules: {
                  create: {
                    workDays: {
                      create: PrismaWorkScheduleMapper.toWorkDaysPrisma(workSchedule),
                    },
                  },
                },
              },
            });
          }
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.workSchedule.delete({
            where: { id },
        });
    }
}
