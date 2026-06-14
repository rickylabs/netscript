import type { ErrorType } from './types.ts';

/** Classify an HTTP status code into the Fresh error taxonomy. */
export function classifyErrorType(status: number): ErrorType {
  if (status >= 400 && status < 500) {
    return 'client';
  }
  if (status >= 500 && status < 600) {
    return 'server';
  }
  return 'unknown';
}

/** Return whether a status and type combination should offer retry affordances. */
export function isRetryable(status: number, type: ErrorType): boolean {
  if (status === 429 || status === 408) {
    return true;
  }
  return type === 'server';
}

/** Return the default user-facing message for a known HTTP status code. */
export function getDefaultMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request';
    case 401:
      return 'Authentication required';
    case 403:
      return 'Access denied';
    case 404:
      return 'Resource not found';
    case 408:
      return 'Request timeout';
    case 422:
      return 'Validation failed';
    case 429:
      return 'Too many requests';
    case 500:
      return 'Internal server error';
    case 502:
      return 'Bad gateway';
    case 503:
      return 'Service unavailable';
    case 504:
      return 'Gateway timeout';
    default:
      return classifyErrorType(status) === 'server' ? 'Server error' : 'Request failed';
  }
}
