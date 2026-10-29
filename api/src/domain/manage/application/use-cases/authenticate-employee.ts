import { left, right, type Either } from "../../../../core/either";
import { NotAllowedError } from "../../../../core/entities/errors/not-allowed-error";
import type { Encrypter } from "../cryptograhpy/encrypter";
import type { HashComparer } from "../cryptograhpy/hash-comparer";
import type { EmployeeRepository } from "../repositories/employee.repository";

export interface AuthenticateEmployeeUseCaseRequest {
  username: string;
  password: string;
}

export interface AuthenticateEmployeeUseCaseResponse {
  accessToken: string;
  employee: {
    id: string;
    username: string;
    role: "ADMIN" | "EMPLOYEE";
  };
}

type AuthenticateEmployeeUseCaseResult = Either<
  NotAllowedError,
  AuthenticateEmployeeUseCaseResponse
>;

export class AuthenticateEmployeeUseCase {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly hashComparer: HashComparer,
    private readonly encrypter: Encrypter,
  ) {}

  async execute(
    request: AuthenticateEmployeeUseCaseRequest,
  ): Promise<AuthenticateEmployeeUseCaseResult> {
    const employee = await this.employeeRepository.findByUsername(request.username);

    if (!employee) {
      return left(new NotAllowedError("Invalid username or password"));
    }

    const passwordMatches = await this.hashComparer.compare(
      request.password,
      employee.password,
    );

    if (!passwordMatches) {
      return left(new NotAllowedError("Invalid username or password"));
    }

    const accessToken = await this.encrypter.encrypt({
      id: employee.id.toString(),
      role: employee.role,
    });

    return right({
      accessToken,
      employee: {
        id: employee.id.toString(),
        username: employee.username,
        role: employee.role,
      },
    });
  }
}
