/** Structured logger boundary consumed by saga runtime code. */
export interface LoggerPort {
  /** Emit debug-level runtime diagnostics. */
  debug(message: string, attributes?: Readonly<Record<string, unknown>>): void;
  /** Emit informational runtime diagnostics. */
  info(message: string, attributes?: Readonly<Record<string, unknown>>): void;
  /** Emit warning-level runtime diagnostics. */
  warn(message: string, attributes?: Readonly<Record<string, unknown>>): void;
  /** Emit error-level runtime diagnostics. */
  error(message: string, attributes?: Readonly<Record<string, unknown>>): void;
}

/** No-op logger used when production logging is not wired. */
export class NoopLogger implements LoggerPort {
  /** Ignore debug-level diagnostics. */
  debug(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}

  /** Ignore informational diagnostics. */
  info(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}

  /** Ignore warning-level diagnostics. */
  warn(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}

  /** Ignore error-level diagnostics. */
  error(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}
}
