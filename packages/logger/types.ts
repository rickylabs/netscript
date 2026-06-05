/**
 * @module @netscript/logger/types
 *
 * TypeScript type definitions for the logger package.
 */

import type { Logger, LogLevel } from '@logtape/logtape';

/**
 * Re-export LogTape types for convenience.
 */
export type { Logger, LogLevel };

/**
 * Logging configuration options.
 */
export interface LoggingConfig {
  /** Minimum log level to output */
  level?: LogLevel;
  /** Output format: 'text' for development, 'json' for production */
  format?: 'text' | 'json';
  /** Include timestamps in output */
  timestamps?: boolean;
  /** Enable colored output (text format only) */
  colors?: boolean;
}

/**
 * Logger options for creating loggers.
 */
export interface LoggerOptions {
  /** Logger name or hierarchy */
  name: string | string[];
  /** Minimum log level (overrides global) */
  level?: LogLevel;
}

/**
 * Request context for logging middleware.
 */
export interface RequestLogContext {
  /** Request ID (generated if not present) */
  requestId?: string;
  /** HTTP method */
  method: string;
  /** Request path */
  path: string;
  /** Response status code */
  status?: number;
  /** Request duration in milliseconds */
  duration?: number;
  /** User ID if authenticated */
  userId?: string;
}
