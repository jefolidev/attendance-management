import { BadRequestError } from "@src/core/entities/errors/bad-request-error";
import { NotFoundError } from "@src/core/entities/errors/not-found-error";
import { left, right, type Either } from "../../../../core/either";
import { DuplicatedError } from "../../../../core/entities/errors/duplicated-error";
import { WorkSchedule } from "../../enterprise/entities/work-schedule";
import type { EmployeeRepository } from "../repositories/employee.repository";
import { WorkScheduleRepository } from "../repositories/work-schedule.repository";

interface CreateWorkScheduleUseCaseRequest {
  startTime: string
  endTime: string

  lateTolerance: number
  breakTimes: number

  days: number[]

  requesterId: string
}

type CreateWorkScheduleUseCaseResponse = Either<BadRequestError | DuplicatedError | NotFoundError, { workscheduleId: string }>

export class CreateWorkScheduleUseCase {
  constructor(private readonly workscheduleRepository: WorkScheduleRepository, private readonly employeeRepository: EmployeeRepository) {}

  async execute(request: CreateWorkScheduleUseCaseRequest): Promise<CreateWorkScheduleUseCaseResponse> {
    const { days, endTime, lateTolerance, requesterId, startTime, breakTimes } = request

    const requester = await this.employeeRepository.findById(requesterId)

    if (!requester) {
      return left(new NotFoundError("Requester not found"))
    }
    
    if(days.length === 0) {
      return left(new BadRequestError("At least one day must be selected"))
    }
    
    if(days.some(day => day < 0 || day > 6)){
      return left(new BadRequestError("Days must be between 0 and 6"))}

    const existingWorkSchedule = await this.workscheduleRepository.findByEmployeeId(requesterId)
    
    if (existingWorkSchedule) {
      return left(new DuplicatedError("Work schedule for this employee already exists"))
    }

    if(startTime >= endTime) {
      return left(new BadRequestError("Start time must be before end time"))
    }

    if(lateTolerance < 0) {
      return left(new BadRequestError("Late tolerance must be a positive number"))
    }

    if(breakTimes < 0) {
      return left(new BadRequestError("Break times must be a positive number"))
    }

    if(startTime === endTime) {
      return left(new BadRequestError("Start time and end time cannot be the same"))
    }

    if(startTime < "00:00" || startTime > "23:59" || endTime < "00:00" || endTime > "23:59") {
      return left(new BadRequestError("Start time and end time must be valid times"))
    }

    const workSchedule = WorkSchedule.create({
      startTime,
      endTime,
      lateTolerance,
      days,
      breakTimes,
      employeeId: requester.id
    })

    await this.workscheduleRepository.create(workSchedule)

    return right({ workscheduleId: workSchedule.id.toString() })
  }
}