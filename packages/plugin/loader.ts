/**
 * @module @netscript/plugin/loader
 *
 * Host-side helpers used by generated plugin service bootstrap modules.
 */

/** Minimal logger shape supplied to plugin service contexts. */
export interface PluginLogger {
  /** Write an informational message. */
  info(message: string, metadata?: Record<string, unknown>): void;
  /** Write a warning message. */
  warn(message: string, metadata?: Record<string, unknown>): void;
  /** Write an error message. */
  error(message: string, metadata?: Record<string, unknown>): void;
  /** Write a debug message. */
  debug(message: string, metadata?: Record<string, unknown>): void;
}

function safeStringifyMetadata(metadata: Record<string, unknown>): string {
  const seen = new WeakSet<object>();
  try {
    return JSON.stringify(metadata, (_key, value) => {
      if (typeof value === 'bigint') {
        return `${value.toString()}n`;
      }
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value as object)) {
          return '[Circular]';
        }
        seen.add(value as object);
      }
      if (typeof value === 'function' || typeof value === 'symbol') {
        return value.toString();
      }
      return value;
    });
  } catch (error) {
    return `[unserializable metadata: ${error instanceof Error ? error.message : String(error)}]`;
  }
}

function writePluginLog(
  pluginName: string,
  level: keyof PluginLogger,
  message: string,
  metadata?: Record<string, unknown>,
): void {
  const payload = metadata && Object.keys(metadata).length > 0
    ? ` ${safeStringifyMetadata(metadata)}`
    : '';
  const line = `[${pluginName}] ${level.toUpperCase()} ${message}${payload}`;
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  sink(line);
}

/** Create a logger scoped to a plugin service process. */
export function createPluginLogger(pluginName: string): PluginLogger {
  return {
    info: (message, metadata) => writePluginLog(pluginName, 'info', message, metadata),
    warn: (message, metadata) => writePluginLog(pluginName, 'warn', message, metadata),
    error: (message, metadata) => writePluginLog(pluginName, 'error', message, metadata),
    debug: (message, metadata) => writePluginLog(pluginName, 'debug', message, metadata),
  };
}
