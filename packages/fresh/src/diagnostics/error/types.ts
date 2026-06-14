/** HTTP-derived error category used by Fresh error rendering helpers. */
export type ErrorType = 'client' | 'server' | 'unknown';

/** Normalized error payload for loaders, handlers, and error displays. */
export interface ErrorData {
  /** User-facing message derived from the source error. */
  message: string;
  /** HTTP status associated with the error. */
  status: number;
  /** Optional machine-readable code. */
  code?: string;
  /** HTTP-derived error classification. */
  type: ErrorType;
  /** Whether retry affordances should be shown. */
  retry: boolean;
  /** Unix epoch timestamp in milliseconds. */
  timestamp: number;
}
