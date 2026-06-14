import type { ErrorData, ErrorType } from './types.ts';

/**
 * Shared error-display payload used by package-owned and app-owned error views.
 */
export interface ErrorPrimitives {
  /** Normalized error payload. */
  error: ErrorData;
  /** Human-readable title for the error surface. */
  errorTitle: string;
  /** User-facing message shown in the view. */
  errorMessage: string;
  /** Optional machine-readable code. */
  errorCode: string | undefined;
  /** HTTP-derived error classification. */
  errorType: ErrorType;
  /** HTTP status associated with the error. */
  errorStatus: number;
  /** Unix epoch timestamp in milliseconds. */
  errorTimestamp: number;
  /** Decorative icon chosen for the error severity. */
  errorIcon: string;
  /** Whether retry affordances should be shown. */
  isRetryable: boolean;
  /** Background utility class for the default renderer. */
  bgColor: string;
  /** Border utility class for the default renderer. */
  borderColor: string;
  /** Text utility class for the default renderer. */
  textColor: string;
}
