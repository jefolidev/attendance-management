import { left, right, type Either } from "@src/core/either";
import { BadRequestError } from "@src/core/entities/errors/bad-request-error";
import { NotFoundError } from "@src/core/entities/errors/not-found-error";
import dayjs from "dayjs";
import { TimeEntry, TimeEntryStage } from "../../enterprise/entities/time-entry";
import { EmployeeRepository } from "../repositories/employee.repository";
import { TimeEntryRepository } from "../repositories/time-entry.repository";
import { WorkScheduleRepository } from "../repositories/work-schedule.repository";

interface RegisterTimeInEntryUseCaseRequest {
  clockIn: Date
  requesterId: string
}

type RegisterTimeInEntryUseCaseResponse = Either<BadRequestError | NotFoundError, { timeEntryId: string }>

export class RegisterTimeInEntryUseCase {
  constructor(
    private readonly timeEntryRepository: TimeEntryRepository, 
    private readonly employeeRepository: EmployeeRepository, 
    private readonly workScheduleRepository: WorkScheduleRepository
  ) {}

  async execute(request: RegisterTimeInEntryUseCaseRequest): Promise<RegisterTimeInEntryUseCaseResponse> {
    const { clockIn, requesterId } = request

    const requester = await this.employeeRepository.findById(requesterId)

    if (!requester) {
      return left(new NotFoundError("Requester not found"))
    }

    const workSchedule = await this.workScheduleRepository.findByEmployeeId(requesterId)

    if (!workSchedule) {
      return left(new NotFoundError("Work schedule not found for this employee"))
    }

    const existingTimeEntry = await this.timeEntryRepository.findByEmployeeId(requesterId)

    const existingTimeEntryForToday = existingTimeEntry?.find(entry => {
      return dayjs(entry.clockIn).isSame(dayjs(clockIn), 'day') || entry.status !== null
    })

    if (existingTimeEntryForToday) {
      return left(new BadRequestError("Time entry for today already exists"))
    }

    const timeEntry = TimeEntry.create({
      clockIn,
      status: TimeEntryStage.CLOCKED_IN,
      employeeId: requester.id,
    }) 
    
    await this.timeEntryRepository.create(timeEntry)
    
    return right({ timeEntryId: timeEntry.id.toString() })
  }
}