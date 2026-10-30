import { left, right, type Either } from '@src/core/either'
import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { NotAllowedError } from '@src/core/entities/errors/not-allowed-error'
import { NotFoundError } from '@src/core/entities/errors/not-found-error'
import type { HashGenerator } from '../../cryptograhpy/hash-generator'
import type { EmployeeRepository } from '../../repositories/employee.repository'
import { ensureAdminAndTarget } from './ensure-admin'
import { validatePassword } from './employee-validation'

interface UpdateEmployeePasswordUseCaseRequest {
	requesterId: string
	employeeId: string
	password: string
}

type UpdateEmployeePasswordUseCaseResponse = Either<
	BadRequestError | NotAllowedError | NotFoundError,
	void
>

export class UpdateEmployeePasswordUseCase {
	constructor(
		private readonly employeeRepository: EmployeeRepository,
		private readonly hashGenerator: HashGenerator,
	) {}

	async execute({
		requesterId,
		employeeId,
		password,
	}: UpdateEmployeePasswordUseCaseRequest): Promise<UpdateEmployeePasswordUseCaseResponse> {
		const passwordError = validatePassword(password)

		if (passwordError) {
			return left(new BadRequestError(passwordError))
		}

		const authorization = await ensureAdminAndTarget(
			this.employeeRepository,
			requesterId,
			employeeId,
		)

		if (authorization.isLeft()) {
			return left(authorization.value)
		}

		authorization.value.changePassword(await this.hashGenerator.hash(password))
		await this.employeeRepository.update(authorization.value)

		return right(undefined)
	}
}
