import type { TokenInvalidator } from '@src/domain/manage/application/cryptograhpy/token-invalidator'

export class InMemoryTokenInvalidator implements TokenInvalidator {
	private readonly invalidatedTokens = new Set<string>()

	async invalidate(token: string): Promise<void> {
		this.invalidatedTokens.add(token)
	}

	async isInvalidated(token: string): Promise<boolean> {
		return this.invalidatedTokens.has(token)
	}

	async cleanup(): Promise<void> {
		this.invalidatedTokens.clear()
	}
}
