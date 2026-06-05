/** Structured logger boundary consumed by trigger runtime code. */
export interface LoggerPort {
  debug(message: string, attributes?: Readonly<Record<string, unknown>>): void;
  info(message: string, attributes?: Readonly<Record<string, unknown>>): void;
  warn(message: string, attributes?: Readonly<Record<string, unknown>>): void;
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
