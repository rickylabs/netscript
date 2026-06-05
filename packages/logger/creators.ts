/**
 * @module @netscript/logger/creators
 *
 * Logger factory functions for creating typed loggers.
 */

import { getLogger, type Logger } from '@logtape/logtape';

/**
 * Create a logger for a NetScript service.
 *
 * Creates a logger with the hierarchy: ['netscript', 'services', serviceName]
 *
 * @example
 * ```typescript
 * import { createServiceLogger } from '@netscript/logger';
 *
 * const logger = createServiceLogger('users');
 * logger.info('Service starting');
 * logger.error('Failed to connect to database', { error });
 * ```
 *
 * @param serviceName - Name of the service
 * @returns Logger instance for the service
 */
export function createServiceLogger(serviceName: string): Logger {
  return getLogger(['netscript', 'services', serviceName]);
}

/**
 * Create a logger for a NetScript package.
 *
 * Creates a logger with the hierarchy: ['netscript', 'packages', packageName]
 *
 * @example
 * ```typescript
 * import { createPackageLogger } from '@netscript/logger';
 *
 * const logger = createPackageLogger('kv');
 * logger.debug('Cache miss', { key });
 * ```
 *
 * @param packageName - Name of the package
 * @returns Logger instance for the package
 */
export function createPackageLogger(packageName: string): Logger {
  return getLogger(['netscript', 'packages', packageName]);
}

/**
 * Create a logger for workers/jobs.
 *
 * Creates a logger with the hierarchy: ['netscript', 'workers', workerName]
 *
 * @example
 * ```typescript
 * import { createWorkerLogger } from '@netscript/logger';
 *
 * const logger = createWorkerLogger('executor');
 * logger.info('Executing job', { jobId });
 * ```
 *
 * @param workerName - Name of the worker component
 * @returns Logger instance for the worker
 */
export function createWorkerLogger(workerName: string): Logger {
  return getLogger(['netscript', 'workers', workerName]);
}

/**
 * Create a logger for a job.
 *
 * Creates a logger with the hierarchy: ['netscript', 'jobs', jobId]
 *
 * @example
 * ```typescript
 * import { createJobLogger } from '@netscript/logger';
 *
 * const logger = createJobLogger('daily-export');
 * logger.info('Job started');
 * logger.info('Processed records', { count: 100 });
 * ```
 *
 * @param jobId - Unique job identifier
 * @returns Logger instance for the job
 */
export function createJobLogger(jobId: string): Logger {
  return getLogger(['netscript', 'jobs', jobId]);
}

/**
 * Create a logger with a custom hierarchy.
 *
 * Use this when you need a logger that doesn't fit the standard
 * service/package/worker categories.
 *
 * @example
 * ```typescript
 * import { createLogger } from '@netscript/logger';
 *
 * // String category
 * const logger1 = createLogger('custom');
 * // Results in hierarchy: ['netscript', 'custom']
 *
 * // Array hierarchy for full control
 * const logger2 = createLogger(['myapp', 'subsystem', 'component']);
 * // Results in hierarchy: ['myapp', 'subsystem', 'component']
 * ```
 *
 * @param category - Logger category (string or array)
 * @returns Logger instance
 */
export function createLogger(category: string | string[]): Logger {
  const hierarchy = typeof category === 'string' ? ['netscript', category] : category;
  return getLogger(hierarchy);
}

/**
 * Create a child logger from a parent logger.
 *
 * This is useful for adding context-specific logging within a function
 * or component while maintaining the parent hierarchy.
 *
 * @example
 * ```typescript
 * import { createServiceLogger, createChildLogger } from '@netscript/logger';
 *
 * const serviceLogger = createServiceLogger('users');
 * const handlerLogger = createChildLogger(serviceLogger, 'getById');
 * // Results in hierarchy: ['netscript', 'services', 'users', 'getById']
 * ```
 *
 * @param parent - Parent logger
 * @param name - Child logger name
 * @returns Child logger instance
 */
export function createChildLogger(parent: Logger, name: string): Logger {
  return parent.getChild(name);
}
