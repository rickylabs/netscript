/** Structured logger boundary consumed by trigger runtime code. */
export interface LoggerPort {
  /** Emit a debug log event. */
  debug(message: string, attributes?: Readonly<Record<string, unknown>>): void;
  /** Emit an info log event. */
  info(message: string, attributes?: Readonly<Record<string, unknown>>): void;
  /** Emit a warning log event. */
  warn(message: string, attributes?: Readonly<Record<string, unknown>>): void;
  /** Emit an error log event. */
  error(message: string, attributes?: Readonly<Record<string, unknown>>): void;
}

/** No-op logger used when production logging is not wired. */
export class NoopLogger implements LoggerPort {
  /** Ignore debug log events. */
  debug(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}

  /** Ignore info log events. */
  info(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}

  /** Ignore warning log events. */
  warn(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}

  /** Ignore error log events. */
  error(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}
}
