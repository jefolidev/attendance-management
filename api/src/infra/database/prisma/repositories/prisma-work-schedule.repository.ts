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
          dayOverrides: {
            create: workSchedule.dayOverrides.map((dayOverride) => ({
              dayOfWeek: dayOverride.dayOfWeek,
              startTime: dayOverride.startTime ?? null,
              endTime: dayOverride.endTime ?? null,
            })),
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
          dayOverrides: true,
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
          dayOverrides: true,
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
              breakStartTime: workSchedule.breakStartTime,
              breakEndTime: workSchedule.breakEndTime,
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

          await transaction.workScheduleDayOverride.deleteMany({
            where: { workScheduleId: workSchedule.id.toString() },
          });

          if (workSchedule.dayOverrides.length > 0) {
            await transaction.workScheduleDayOverride.createMany({
              data: workSchedule.dayOverrides.map((dayOverride) => ({
                workScheduleId: workSchedule.id.toString(),
                dayOfWeek: dayOverride.dayOfWeek,
                startTime: dayOverride.startTime ?? null,
                endTime: dayOverride.endTime ?? null,
              })),
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
