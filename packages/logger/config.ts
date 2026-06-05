/**
 * @module @netscript/logger/config
 *
 * LogTape configuration and initialization utilities.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import {
  configure,
  getConsoleSink,
  getJsonLinesFormatter,
  type LogLevel,
  reset,
  type Sink,
} from '@logtape/logtape';
import type { LoggingConfig } from './types.ts';

let isConfigured = false;
const contextLocalStorage = new AsyncLocalStorage<Record<string, unknown>>();

/**
 * Default logging configuration based on environment.
 */
function getDefaultConfig(): LoggingConfig {
  const isProduction = Deno.env.get('DENO_ENV') === 'production';
  const isDeployment = Boolean(Deno.env.get('DENO_DEPLOYMENT_ID'));

  return {
    level: (Deno.env.get('NETSCRIPT_LOG_LEVEL') as LogLevel) ?? (isProduction ? 'info' : 'debug'),
    format: isProduction || isDeployment ? 'json' : 'text',
    timestamps: true,
    colors: !isProduction && !Deno.env.get('NO_COLOR'),
  };
}

/**
 * Configure LogTape for NetScript applications.
 *
 * This function sets up LogTape with appropriate sinks and loggers
 * based on the provided configuration or sensible defaults.
 *
 * @example
 * ```typescript
 * import { configureLogging } from '@netscript/logger';
 *
 * // Use defaults (auto-detects environment)
 * await configureLogging();
 *
 * // Custom configuration
 * await configureLogging({
 *   level: 'debug',
 *   format: 'text',
 *   colors: true,
 * });
 * ```
 *
 * @param config - Logging configuration options
 */
export async function configureLogging(config?: LoggingConfig): Promise<void> {
  const { level, format } = {
    ...getDefaultConfig(),
    ...config,
  };

  const sink: Sink = format === 'json'
    ? getConsoleSink({
      formatter: getJsonLinesFormatter({
        categorySeparator: '.',
      }),
    })
    : getConsoleSink({});

  await configure(
    {
      reset: true,
      contextLocalStorage,
      sinks: {
        console: sink,
      },
      loggers: [
        {
          // Root NetScript logger
          category: ['netscript'],
          sinks: ['console'],
          lowestLevel: Deno.env.get('NETSCRIPT_DEBUG') ? 'debug' : level,
        },
        {
          // Allow external libraries to log at warning+ only
          category: [],
          sinks: ['console'],
          lowestLevel: 'warning',
        },
      ],
    },
  );

  isConfigured = true;
}

/**
 * Reset LogTape configuration.
 *
 * This is useful for testing or when you need to reconfigure logging.
 */
export async function resetLogging(): Promise<void> {
  await reset();
  isConfigured = false;
}

/**
 * Ensure logging is configured, initializing with defaults if needed.
 *
 * This is safe to call multiple times - it will only configure once.
 *
 * @example
 * ```typescript
 * import { ensureLogging, createServiceLogger } from '@netscript/logger';
 *
 * // Safe to call anywhere
 * await ensureLogging();
 *
 * const logger = createServiceLogger('my-service');
 * logger.info('Now logging works!');
 * ```
 */
export async function ensureLogging(config?: LoggingConfig): Promise<void> {
  if (isConfigured) return;

  await configureLogging(config);
  isConfigured = true;
}

/**
 * Mark logging as configured (for manual configuration scenarios).
 */
export function markConfigured(): void {
  isConfigured = true;
}

/**
 * Check if logging is configured.
 */
export function isLoggingConfigured(): boolean {
  return isConfigured;
}
