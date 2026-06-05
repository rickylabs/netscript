import { BaseLogger } from './base-logger.ts';

/** Logger adapter that intentionally discards all log messages. */
export class SilentLogger extends BaseLogger {
  override write(_level: 'debug' | 'error' | 'info' | 'warn', _message: string): void {
    // Intentionally empty.
  }
}
