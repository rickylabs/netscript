/**
 * @module @netscript/logger
 *
 * Structured logging for NetScript packages, services, workers, and jobs.
 *
 * The root entrypoint exposes the lightweight core surface only. Import
 * `@netscript/logger/middleware` for Hono request logging and
 * `@netscript/logger/orpc` for the oRPC logging plugin.
 *
 * @example
 * ```typescript
 * import { configureLogging, createServiceLogger } from '@netscript/logger';
 *
 * await configureLogging({ level: 'info' });
 *
 * const logger = createServiceLogger('users');
 * logger.info('Service starting', { port: 3000 });
 * ```
 *
 * @example
 * ```typescript
 * import { loggerMiddleware } from '@netscript/logger/middleware';
 * import { LoggingPlugin } from '@netscript/logger/orpc';
 * ```
 */

export {
  configure,
  getConsoleSink,
  getLogger,
  type Logger,
  type LogLevel,
  type LogRecord,
  type Sink,
  withContext,
} from '@logtape/logtape';

export {
  createChildLogger,
  createJobLogger,
  createLogger,
  createPackageLogger,
  createServiceLogger,
  createWorkerLogger,
} from './creators.ts';

export {
  configureLogging,
  ensureLogging,
  isLoggingConfigured,
  markConfigured,
  resetLogging,
} from './config.ts';

export type { LoggerOptions, LoggingConfig, RequestLogContext } from './types.ts';
