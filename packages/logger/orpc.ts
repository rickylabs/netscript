/**
 * @module @netscript/logger/orpc
 *
 * oRPC logging integration for NetScript services.
 */

export type { Logger } from '@logtape/logtape';

export {
  type ClientLoggingInterceptor,
  type ClientLoggingInterceptorOptions,
  createLoggerContext,
  createLoggingPlugin,
  type LoggerContext,
  type LoggingHandlerOptions,
  type LoggingInterceptor,
  LoggingPlugin,
  type LoggingPluginOptions,
  type LogLevelConfig,
  type RootLoggingInterceptor,
  type RootLoggingInterceptorOptions,
} from './orpc-plugin.ts';
