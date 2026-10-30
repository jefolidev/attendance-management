import { TokenInvalidator } from '@src/domain/manage/application/cryptograhpy/token-invalidator'

export class FakeTokenInvalidator implements TokenInvalidator {
	tokens: string[] = []

	async invalidate(token: string): Promise<void> {
		this.tokens.push(token)
	}

	async isInvalidated(token: string): Promise<boolean> {
		return this.tokens.includes(token)
	}

	async cleanup(): Promise<void> {
		this.tokens = []
	}
}
