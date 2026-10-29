export interface PaginationParams {
	page: number
	perPage?: number
}

export interface PaginationMeta {
	page: number
	perPage: number
	hasNextPage: boolean
}

export const DEFAULT_PAGE_SIZE = 20

export function normalizePagination(params?: Partial<PaginationParams>): Required<
	Pick<PaginationParams, 'page' | 'perPage'>
> {
	return {
		page: Math.max(1, params?.page ?? 1),
		perPage: Math.min(
			100,
			Math.max(1, params?.perPage ?? DEFAULT_PAGE_SIZE),
		),
	}
}
