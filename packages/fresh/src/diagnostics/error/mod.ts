/**
 * Explicit error-handling surface for `@netscript/fresh`.
 *
 * @module
 */

export {
  ErrorDisplay,
  type ErrorDisplayContent,
  type ErrorDisplayProps,
  type ErrorPrimitives,
  InlineError,
} from './ErrorDisplay.tsx';
export { classifyErrorType, getDefaultMessage, isRetryable } from './classify.ts';
export { extractErrorData } from './extract.ts';
export {
  errorHandler,
  extractData,
  extractDataWithFallback,
  extractErrorWithFallback,
  hasError,
  type LoaderResult,
  safeParseData,
  safeParseDataWithFallback,
} from './handler.ts';
export type { ErrorData, ErrorType } from './types.ts';
