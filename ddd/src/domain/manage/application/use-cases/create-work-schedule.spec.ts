import { BadRequestError } from "@src/core/entities/errors/bad-request-error";
import { makeEmployee } from "@test/factories/make-employee";
import { InMemoryEmployeeRepository } from "@test/repositories/repository/in-memory-employee.repository";
import { InMemoryWorkScheduleRepository } from "@test/repositories/repository/in-memory-work-schedule.repository";
import { CreateWorkScheduleUseCase } from "./create-work-schedule";

let inMemoryWorkScheduleRepository: InMemoryWorkScheduleRepository
let inMemoryEmployeeRepository: InMemoryEmployeeRepository
let sut: CreateWorkScheduleUseCase

describe('Create WorkSchedule', () => {
  beforeEach(() => {
    inMemoryWorkScheduleRepository = new InMemoryWorkScheduleRepository()
    inMemoryEmployeeRepository = new InMemoryEmployeeRepository()
    sut = new CreateWorkScheduleUseCase(inMemoryWorkScheduleRepository, inMemoryEmployeeRepository)
  })

  it('should be able to create a workschedule', async () => {
    const requester = makeEmployee()
    await inMemoryEmployeeRepository.create(requester)

    const response = await sut.execute({
      days: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '17:00',
      lateTolerance: 5,
      requesterId: requester.id.toString()
    })

    expect(response.isRight()).toBe(true)
    expect(inMemoryWorkScheduleRepository.items).toHaveLength(1)
    expect(inMemoryWorkScheduleRepository.items[0]!.employeeId).toBe(requester.id) 
  })

  it('should not be able to create a workschedule with invalid days', async () => {
    const requester = makeEmployee()
    await inMemoryEmployeeRepository.create(requester)

    const response = await sut.execute({
      days: [1, 2, 3, 4, 5, 6, 7],
      startTime: '09:00',
      endTime: '17:00',
      lateTolerance: 5,
      requesterId: requester.id.toString()
    })

    expect(response.isLeft()).toBe(true)
    expect(response.value).toBeInstanceOf(BadRequestError)
  })

  it('should not be able to create a workschedule without days', async () => {
    const requester = makeEmployee()
    await inMemoryEmployeeRepository.create(requester)

    const response = await sut.execute({
      days: [],
      startTime: '09:00',
      endTime: '17:00',
      lateTolerance: 5,
      requesterId: requester.id.toString()
    })

    expect(response.isLeft()).toBe(true)
    expect(response.value).toBeInstanceOf(BadRequestError)
  })

  it('should not be able to create a workschedule with invalid times', async () => {
    const requester = makeEmployee()
    await inMemoryEmployeeRepository.create(requester)

    const response = await sut.execute({
      days: [1, 2, 3, 4, 5],
      startTime: '25:00',
      endTime: '17:00',
      lateTolerance: 5,
      requesterId: requester.id.toString()
    })

    expect(response.isLeft()).toBe(true)
    expect(response.value).toBeInstanceOf(BadRequestError)
  })  
})