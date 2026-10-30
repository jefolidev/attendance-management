import { left, right, type Either } from '@src/core/either'
import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import type { TokenInvalidator } from '../cryptograhpy/token-invalidator'

export interface LogoutEmployeeUseCaseRequest {
	token: string
}

export class LogoutEmployeeUseCase {
	constructor(private readonly tokenInvalidator: TokenInvalidator) {}

	async execute({
		token,
	}: LogoutEmployeeUseCaseRequest): Promise<Either<BadRequestError, void>> {
		if (!token.trim()) {
			return left(new BadRequestError('Token is required'))
		}

		await this.tokenInvalidator.invalidate(token)

		return right(undefined)
	}
}
