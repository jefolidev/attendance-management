import type { UseCaseError } from './use-case-error';

export class BadRequestError extends Error implements UseCaseError {
  constructor(message = 'Bad Request') {
    super(message)
  }
}