/**
 * Logger port shared by CLI application services.
 */

/** Structured logger abstraction. */
export interface LoggerPort {
  /** Write an informational message. */
  info(message: string): void;

  /** Write a warning message. */
  warn(message: string): void;

  /** Write an error message. */
  error(message: string): void;

  /** Write a debug message. */
  debug(message: string): void;
}
