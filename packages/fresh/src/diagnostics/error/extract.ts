import { isDefinedError } from '@netscript/sdk/client';
import { HttpError } from 'fresh';
import { classifyErrorType, getDefaultMessage, isRetryable } from './classify.ts';
import type { ErrorData } from './types.ts';

/** Extract a normalized Fresh error payload from any thrown value. */
export function extractErrorData(error: unknown): ErrorData {
  const timestamp = Date.now();

  if (error instanceof HttpError) {
    const type = classifyErrorType(error.status);
    return {
      message: error.message || getDefaultMessage(error.status),
      status: error.status,
      code: `HTTP_${error.status}`,
      type,
      retry: isRetryable(error.status, type),
      timestamp,
    };
  }

  if (error && typeof error === 'object' && isDefinedError(error)) {
    const definedError = error as {
      code?: string;
      status?: number;
      message?: string;
    };
    const status = definedError.status ?? 500;
    const type = classifyErrorType(status);

    return {
      message: definedError.message || getDefaultMessage(status),
      status,
      code: definedError.code ?? 'ORPC_ERROR',
      type,
      retry: isRetryable(status, type),
      timestamp,
    };
  }

  if (error instanceof Error) {
    const maybeHttpError = error as Error & {
      code?: string;
      status?: number;
    };
    const status = maybeHttpError.status ?? 500;
    const type = classifyErrorType(status);

    return {
      message: error.message || getDefaultMessage(status),
      status,
      code: maybeHttpError.code ?? 'INTERNAL_ERROR',
      type,
      retry: isRetryable(status, type),
      timestamp,
    };
  }

  const type = 'server';
  return {
    message: 'An unexpected error occurred',
    status: 500,
    code: 'UNKNOWN_ERROR',
    type,
    retry: isRetryable(500, type),
    timestamp,
  };
}
