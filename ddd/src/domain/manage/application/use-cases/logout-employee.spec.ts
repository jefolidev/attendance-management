import { BadRequestError } from '@src/core/entities/errors/bad-request-error'
import { FakeTokenInvalidator } from '@test/cryptography/fake-token-invalidator'
import { LogoutEmployeeUseCase } from './logout-employee'

let tokenInvalidator: FakeTokenInvalidator
let sut: LogoutEmployeeUseCase

describe('Logout Employee', () => {
	beforeEach(() => {
		tokenInvalidator = new FakeTokenInvalidator()
		sut = new LogoutEmployeeUseCase(tokenInvalidator)
	})

	it('invalidates the current token', async () => {
		const response = await sut.execute({ token: 'token-to-revoke' })

		expect(response.isRight()).toBe(true)
		expect(tokenInvalidator.tokens).toContain('token-to-revoke')
	})

	it('rejects an empty token', async () => {
		const response = await sut.execute({ token: '  ' })

		expect(response.isLeft()).toBe(true)
		expect(response.value).toBeInstanceOf(BadRequestError)
	})
})
