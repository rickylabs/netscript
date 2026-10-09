/**
 * @module
 *
 * oRPC logging integration for NetScript services.
 */

import { getLogger, type Logger } from '@logtape/logtape';
import { DEFAULT_RPC_SKIP_PATHS } from './constants.ts';
import { createFieldRedactor, type FieldRedactor, REDACTED_VALUE } from './redaction.ts';

/**
 * Request-scoped oRPC context as seen by the logging interceptors.
 *
 * oRPC forwards the context a root interceptor passes to `next({ context })` to every procedure
 * interceptor of the same request, which is how the plugin keeps request state per request.
 */
export type LoggingInterceptorContext = Record<PropertyKey, unknown>;

/**
 * Minimal root-level interceptor contract used by the logger plugin.
 */
export interface RootLoggingInterceptorOptions {
  /** Request-scoped oRPC context, forwarded to procedure interceptors. */
  context?: LoggingInterceptorContext;
  /** Continue to the next interceptor or handler, optionally with replaced options. */
  next: (options?: RootLoggingInterceptorOptions) => Promise<unknown>;
}

/**
 * Procedure-level interceptor contract used by the logger plugin.
 */
export interface ClientLoggingInterceptorOptions {
  /** Request-scoped oRPC context received from the root interceptors. */
  context?: LoggingInterceptorContext;
  /** Procedure input passed to the client interceptor. */
  input: unknown;
  /** Procedure path segments or dot-joined path. */
  path: string | readonly string[];
  /** Continue to the next interceptor or procedure. */
  next: () => Promise<unknown>;
}

/**
 * Root-level logging interceptor signature.
 */
export type RootLoggingInterceptor = (
  options: RootLoggingInterceptorOptions,
) => Promise<unknown>;

/**
 * Procedure-level logging interceptor signature.
 */
export type ClientLoggingInterceptor = (
  options: ClientLoggingInterceptorOptions,
) => Promise<unknown>;

/** Logging interceptor variants accepted by the plugin's handler arrays. */
export type LoggingInterceptor = RootLoggingInterceptor | ClientLoggingInterceptor;

/**
 * Minimal mutable handler options contract accepted by {@link LoggingPlugin#init}.
 */
export interface LoggingHandlerOptions {
  /** Root-level interceptors attached to the handler. */
  clientInterceptors?: LoggingInterceptor[];
  /** Request-level interceptors attached to the handler. */
  rootInterceptors?: LoggingInterceptor[];
}

/**
 * Log levels for different event types.
 */
export interface LogLevelConfig {
  /** Log level for procedure start events. */
  start?: 'debug' | 'info';
  /** Log level for successful completions. */
  success?: 'debug' | 'info';
  /** Log level for client errors (4xx). */
  clientError?: 'warn' | 'error';
  /** Log level for server errors (5xx). */
  serverError?: 'error';
}

/**
 * Options for the {@link LoggingPlugin}.
 */
export interface LoggingPluginOptions {
  /**
   * Service name for logger hierarchy.
   * Logger will be `netscript.services.{serviceName}.rpc`.
   */
  serviceName?: string;

  /**
   * Enable debug mode for verbose logging.
   *
   * @default false, or `NETSCRIPT_DEBUG=true`
   */
  debug?: boolean;

  /**
   * Log levels for different event types.
   */
  levels?: LogLevelConfig;

  /**
   * Whether to log input keys, not values.
   *
   * @default true
   */
  logInputKeys?: boolean;

  /**
   * Maximum number of input keys to log.
   *
   * @default 20
   */
  maxInputKeys?: number;

  /**
   * Procedure paths to skip logging for.
   *
   * @default ['v1.health.*']
   */
  skipPaths?: string[];

  /**
   * Extra field-name fragments to redact from debug-mode `input` and `inputSummary` logs.
   *
   * Matching is case-insensitive and by substring, so `'brief'` also redacts `briefing`. These
   * extend, and never replace, the defaults: fragments such as `password`, `token`, `secret`,
   * `key`, and `auth`, plus the exact names `handle` and `prompt` (exact so that `handler` stays
   * visible). Pass `'prompt'` here to also redact keys like `systemPrompt`.
   *
   * @default []
   *
   * @example
   * ```ts
   * import { LoggingPlugin } from '@netscript/logger/orpc';
   *
   * const plugin = new LoggingPlugin({
   *   serviceName: 'cockpit',
   *   debug: true,
   *   redactFields: ['brief', 'prompt'],
   * });
   * ```
   */
  redactFields?: readonly string[];

  /**
   * Custom logger instance.
   */
  logger?: Logger;
}

/**
 * LoggingPlugin for oRPC handlers.
 *
 * Every log line carries the `requestId` of the request it belongs to, including under concurrent
 * traffic: the root interceptor passes the request ID to procedure interceptors through the
 * request's own oRPC context and times the request locally, so no state is shared across
 * requests. Procedures in one batched request share that request's ID.
 *
 * @example
 * ```ts
 * import { LoggingPlugin } from '@netscript/logger/orpc';
 * import { RPCHandler } from '@orpc/server/fetch';
 *
 * const rpcHandler = new RPCHandler(router, {
 *   plugins: [new LoggingPlugin({ serviceName: 'users' })],
 * });
 * ```
 */
export class LoggingPlugin {
  private readonly logger: Logger;
  private readonly options:
    & Required<Omit<LoggingPluginOptions, 'logger' | 'redactFields'>>
    & { logger?: Logger };
  private readonly redactor: FieldRedactor;

  /**
   * Plugin order. Runs after tracing and before error handling.
   */
  order = 900;

  /**
   * Creates a new oRPC logging plugin.
   *
   * @param options - Plugin configuration.
   */
  constructor(options: LoggingPluginOptions = {}) {
    const serviceName = options.serviceName ?? 'unknown';

    this.options = {
      serviceName,
      debug: options.debug ?? Boolean(Deno.env.get('NETSCRIPT_DEBUG')),
      levels: {
        start: options.levels?.start ?? 'debug',
        success: options.levels?.success ?? 'debug',
        clientError: options.levels?.clientError ?? 'warn',
        serverError: options.levels?.serverError ?? 'error',
      },
      logInputKeys: options.logInputKeys ?? true,
      maxInputKeys: options.maxInputKeys ?? 20,
      skipPaths: options.skipPaths ?? [...DEFAULT_RPC_SKIP_PATHS],
      logger: options.logger,
    };

    this.logger = options.logger ?? getLogger(['netscript', 'services', serviceName, 'rpc']);
    this.redactor = createFieldRedactor(options.redactFields);
  }

  /**
   * Initialize the plugin by adding interceptors to the handler options.
   *
   * @param handlerOptions - Mutable oRPC handler configuration.
   */
  init(handlerOptions: LoggingHandlerOptions, _router?: unknown): void {
    const { debug, levels, logInputKeys, maxInputKeys, skipPaths, serviceName } = this.options;
    const logger = this.logger;
    const redactor = this.redactor;
    const startLevel = levels.start ?? 'debug';
    const successLevel = levels.success ?? 'debug';
    const clientErrorLevel = levels.clientError ?? 'warn';
    const serverErrorLevel = levels.serverError ?? 'error';
    // One key per plugin instance, so two LoggingPlugins on one handler never share state.
    const requestIdKey = Symbol('netscript.logger.orpc.requestId');

    const rootInterceptor: RootLoggingInterceptor = async (
      options: RootLoggingInterceptorOptions,
    ) => {
      const startTime = performance.now();
      const requestId = createRequestId();
      const requestLogger = logger.with({ requestId, service: serviceName });

      if (debug) {
        requestLogger.debug('RPC request started');
      }

      try {
        const result = await options.next({
          ...options,
          context: { ...options.context, [requestIdKey]: requestId },
        });

        if (debug && hasMatchedResult(result)) {
          requestLogger.debug('RPC request completed', {
            duration: Math.round(performance.now() - startTime),
          });
        }

        return result;
      } catch (error: unknown) {
        const err = toLoggableError(error);

        requestLogger[serverErrorLevel]('RPC request failed', {
          code: err.code ?? 'UNKNOWN',
          duration: Math.round(performance.now() - startTime),
          error: err.message,
        });

        throw error;
      }
    };

    const clientInterceptor: ClientLoggingInterceptor = async (
      options: ClientLoggingInterceptorOptions,
    ) => {
      const startTime = performance.now();
      const procedurePath = Array.isArray(options.path)
        ? options.path.join('.')
        : String(options.path);

      if (shouldSkipPath(procedurePath, skipPaths)) {
        return await options.next();
      }

      const requestId = readRequestId(options.context, requestIdKey);
      const procedureLogger = logger.with({
        procedure: procedurePath,
        requestId,
        service: serviceName,
      });

      if (debug || startLevel === 'info') {
        procedureLogger[startLevel]('RPC procedure started', {
          inputSummary: formatInputSummary(options.input, debug, maxInputKeys, redactor),
          ...(logInputKeys ? { inputKeys: extractInputKeys(options.input, maxInputKeys) } : {}),
          ...(debug && options.input ? { input: redactor.redact(options.input) } : {}),
        });
      }

      try {
        const result = await options.next();
        const duration = Math.round(performance.now() - startTime);

        if (debug) {
          procedureLogger[successLevel]('RPC procedure completed', {
            duration,
            resultSummary: formatResultSummary(result),
          });
        }

        return result;
      } catch (error: unknown) {
        const duration = Math.round(performance.now() - startTime);
        const err = toLoggableError(error);
        const isClientError = typeof err.status === 'number' && err.status >= 400 &&
          err.status < 500;
        const level = isClientError ? clientErrorLevel : serverErrorLevel;

        procedureLogger[level]('RPC procedure failed', {
          code: err.code ?? 'UNKNOWN',
          duration,
          error: err.message,
          ...(typeof err.status === 'number' ? { status: err.status } : {}),
          ...(err.cause !== undefined ? { cause: err.cause } : {}),
          ...(debug && err.stack ? { stack: err.stack } : {}),
        });

        throw error;
      }
    };

    handlerOptions.rootInterceptors ??= [];
    handlerOptions.rootInterceptors.push(rootInterceptor);
    handlerOptions.clientInterceptors ??= [];
    handlerOptions.clientInterceptors.push(clientInterceptor);
  }
}

/**
 * Create a LoggingPlugin instance.
 *
 * @param options - Plugin options.
 * @returns A new {@link LoggingPlugin} instance.
 */
export function createLoggingPlugin(options?: LoggingPluginOptions): LoggingPlugin {
  return new LoggingPlugin(options);
}

/**
 * Logger context for oRPC handlers.
 */
export interface LoggerContext {
  /** Logger instance for the current request. */
  logger: Logger;
  /** Request ID for correlation. */
  requestId: string;
}

/**
 * Create a logger context for injection into oRPC handlers.
 *
 * @param serviceName - Service name for logger hierarchy.
 * @returns Logger context with logger and request ID.
 */
export function createLoggerContext(serviceName: string): LoggerContext {
  const requestId = createRequestId();

  return {
    logger: getLogger(['netscript', 'services', serviceName]).with({ requestId }),
    requestId,
  };
}

function createRequestId(): string {
  return crypto.randomUUID().split('-')[0];
}

/** Reads the request ID the root interceptor stored in this request's oRPC context. */
function readRequestId(context: LoggingInterceptorContext | undefined, key: symbol): string {
  const requestId = context?.[key];
  return typeof requestId === 'string' ? requestId : 'unknown';
}

function shouldSkipPath(path: string, skipPaths: readonly string[]): boolean {
  return skipPaths.some((skipPath) =>
    skipPath.endsWith('*') ? path.startsWith(skipPath.slice(0, -1)) : path === skipPath
  );
}

function extractInputKeys(input: unknown, maxKeys: number): string[] {
  if (!input || typeof input !== 'object') {
    return [];
  }

  const keys = Object.keys(input);
  return keys.length > maxKeys
    ? [...keys.slice(0, maxKeys), `...(${keys.length - maxKeys} more)`]
    : keys;
}

function formatInputSummary(
  input: unknown,
  debug: boolean,
  maxKeys: number,
  redactor: FieldRedactor,
): string {
  if (!input || typeof input !== 'object') {
    return '';
  }

  const entries = Object.entries(input);
  if (entries.length === 0) {
    return '';
  }

  if (debug) {
    const formatted = entries.slice(0, 5)
      .map(([key, value]) =>
        `${key}=${redactor.isSensitiveKey(key) ? REDACTED_VALUE : formatValue(value)}`
      )
      .join(', ');
    return entries.length > 5 ? `${formatted}, ...+${entries.length - 5} more` : formatted;
  }

  const keys = entries.slice(0, maxKeys).map(([key]) => key);
  return entries.length > maxKeys
    ? `${keys.join(', ')}, ...+${entries.length - keys.length} more`
    : keys.join(', ');
}

function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') {
    return value.length > 50 ? `"${value.slice(0, 50)}..."` : `"${value}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return `{${Object.keys(value).length} keys}`;
  return String(value);
}

function formatResultSummary(result: unknown): string {
  if (result === null) return 'null';
  if (result === undefined) return 'undefined';
  if (typeof result !== 'object') return String(result);

  const obj = result as Record<string, unknown>;

  if ('items' in obj && Array.isArray(obj.items)) {
    const total = typeof obj.total === 'number' ? ` of ${obj.total}` : '';
    return `[${obj.items.length}${total} items]`;
  }

  if ('id' in obj) {
    const name = typeof obj.name === 'string' ? `, name="${obj.name}"` : '';
    return `{id: ${String(obj.id)}${name}}`;
  }

  if ('success' in obj) {
    return obj.success ? 'success' : 'failure';
  }

  if ('count' in obj) {
    return `{count: ${String(obj.count)}}`;
  }

  const keys = Object.keys(obj);
  return keys.length <= 3 ? `{${keys.join(', ')}}` : `{${keys.length} fields}`;
}

function toLoggableError(error: unknown): Error & {
  code?: string;
  status?: number;
  cause?: unknown;
} {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}

function hasMatchedResult(result: unknown): result is { matched?: boolean } {
  return typeof result === 'object' && result !== null && 'matched' in result;
}
