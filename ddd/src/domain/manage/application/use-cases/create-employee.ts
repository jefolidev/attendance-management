import { left, right, type Either } from "../../../../core/either";
import { BadRequestError } from "../../../../core/entities/errors/bad-request-error";
import { DuplicatedError } from "../../../../core/entities/errors/duplicated-error";
import { NotAllowedError } from "../../../../core/entities/errors/not-allowed-error";
import { Employee } from "../../enterprise/entities/employee";
import type { HashGenerator } from "../cryptograhpy/hash-generator";
import { EmployeeRepository } from "../repositories/employee.repository";
import { validatePassword, validateRole, validateUsername } from './admin/employee-validation'

interface CreateEmployeeUseCaseRequest {
  username: string
  password: string

  role: "ADMIN" | "EMPLOYEE"

  requesterId: string
}

type CreateEmployeeUseCaseResponse = Either<DuplicatedError | NotAllowedError | BadRequestError, { employeeId: string }>

export class CreateEmployeeUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository, private readonly hashGenerator: HashGenerator) {}

  async execute(request: CreateEmployeeUseCaseRequest): Promise<CreateEmployeeUseCaseResponse> {
    const { username, password, role, requesterId } = request
	const usernameError = validateUsername(username)
	const passwordError = validatePassword(password)
	const roleError = validateRole(role)

	if (usernameError || passwordError || roleError) {
		return left(new BadRequestError(usernameError || passwordError || roleError || 'Invalid employee data'))
	}

    const requester = await this.employeeRepository.findById(requesterId)

    if (!requester) {
      return left(new NotAllowedError("Requester not found"))
    }
    
    if(requester.isEmployee()) {
      return left(new NotAllowedError("Only admins can create new employees"))
    }

    const existingEmployee = await this.employeeRepository.findByUsername(username)
    
    if (existingEmployee) {
      return left(new DuplicatedError("Employee with this username already exists"))
    }

    const employee = Employee.create({
      username: username.trim(),
      password: await this.hashGenerator.hash(password),
      role
    })

    await this.employeeRepository.create(employee)

    return right({ employeeId: employee.id.toString() })
  }
}
