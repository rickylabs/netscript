/**
 * oRPC tracing and error-handling helpers for {@linkcode @netscript/telemetry}.
 */

export * from './_types.ts';
export { createTracingPlugin, TracingPlugin, type TracingPluginOptions } from './tracing-plugin.ts';
export {
  createErrorHandlingPlugin,
  type ErrorClassification,
  type ErrorClassifier,
  type ErrorContext,
  ErrorHandlingPlugin,
  type ErrorHandlingPluginOptions,
  type ErrorLogger,
  type LogLevel,
} from './error-plugin.ts';
export {
  addEvent,
  createTraceContext,
  getSpanId,
  getTraceId,
  setAttributes,
  type TraceContext,
} from './handler-context.ts';
