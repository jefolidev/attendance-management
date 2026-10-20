import { DuplicatedError } from "@src/core/entities/errors/duplicated-error";
import { NotAllowedError } from "@src/core/entities/errors/not-allowed-error";
import { FakeHasher } from "@test/cryptography/fake-hasher";
import { makeEmployee } from "@test/factories/make-employee";
import { InMemoryEmployeeRepository } from "@test/repositories/repository/in-memory-employee.repository";
import { CreateEmployeeUseCase } from "./create-employee";

let inMemoryEmployeeRepository: InMemoryEmployeeRepository
let hashGenerator: FakeHasher
let sut: CreateEmployeeUseCase

describe('Create Employee', () => {
  beforeEach(() => {
    inMemoryEmployeeRepository = new InMemoryEmployeeRepository()
    hashGenerator = new FakeHasher()
    sut = new CreateEmployeeUseCase(inMemoryEmployeeRepository, hashGenerator)
  })

  it('should be able to create a employee', async () => {
    const requester = makeEmployee({ role: 'ADMIN' })
    await inMemoryEmployeeRepository.create(requester)
    
    const response = await sut.execute({
      username: 'John Doe',
      role: 'EMPLOYEE',
      password: 'password123',
      requesterId: requester.id.toString()
    })

    expect(response.isRight()).toBe(true)
    expect(inMemoryEmployeeRepository.items).toHaveLength(2)
    expect(inMemoryEmployeeRepository.items[1]!.username).toBe('John Doe')
    expect(inMemoryEmployeeRepository.items[1]!.password).toBe('password123-hashed')
  })

  it('should not be able to create a employee with duplicated username', async () => {
    const requester = makeEmployee({ role: 'ADMIN' })
    await inMemoryEmployeeRepository.create(requester)

    await sut.execute({
      username: 'John Doe',
      role: 'EMPLOYEE',
      password: 'password123', 
      requesterId: requester.id.toString()  
    })

    const response = await sut.execute({
      username: 'John Doe',
      role: 'EMPLOYEE',
      password: 'password123', 
      requesterId: requester.id.toString()
    })

    expect(response.isLeft()).toBe(true)
    expect(response.value).toBeInstanceOf(DuplicatedError)
  })

  it('should not be able to create a employee if requester is not an admin', async () => {
    const requester = makeEmployee({ role: 'EMPLOYEE' })
    await inMemoryEmployeeRepository.create(requester)

    const response = await sut.execute({
      username: 'John Doe',
      role: 'EMPLOYEE',
      password: 'password123',
      requesterId: requester.id.toString()
    })

    expect(response.isLeft()).toBe(true)
    expect(response.value).toBeInstanceOf(NotAllowedError)
  })
})