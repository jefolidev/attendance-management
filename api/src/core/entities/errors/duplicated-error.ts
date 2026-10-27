import type { UseCaseError } from "./use-case-error";

export class DuplicatedError extends Error implements UseCaseError {
  constructor(message = 'Resource already exists') {
    super(message)
  }
}