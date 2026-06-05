import type { LoggerPort } from '../../ports/logger-port.ts';

/** Shared logger adapter contract for logger implementations. */
export abstract class BaseLogger implements LoggerPort {
  /** Write a level-tagged message. */
  protected abstract write(level: 'debug' | 'error' | 'info' | 'warn', message: string): void;

  /** Write an informational message. */
  info(message: string): void {
    this.write('info', message);
  }

  /** Write a warning message. */
  warn(message: string): void {
    this.write('warn', message);
  }

  /** Write an error message. */
  error(message: string): void {
    this.write('error', message);
  }

  /** Write a debug message. */
  debug(message: string): void {
    this.write('debug', message);
  }
}
