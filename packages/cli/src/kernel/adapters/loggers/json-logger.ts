import { outputJson } from '../../presentation/output/default-output.ts';
import { BaseLogger } from './base-logger.ts';

/** Logger adapter that emits structured JSON output events. */
export class JsonLogger extends BaseLogger {
  override write(level: 'debug' | 'error' | 'info' | 'warn', message: string): void {
    outputJson({
      level,
      message,
      timestamp: new Date().toISOString(),
    }, level === 'error' || level === 'warn' ? 'stderr' : 'stdout');
  }
}
