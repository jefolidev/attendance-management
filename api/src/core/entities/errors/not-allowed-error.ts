import type { UseCaseError } from './use-case-error';

export class NotAllowedError extends Error implements UseCaseError {
  constructor(message = 'Not allowed') {
    super(message)
  }
}