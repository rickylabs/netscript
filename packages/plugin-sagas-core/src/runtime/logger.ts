/** Structured logger boundary consumed by saga runtime code. */
export interface LoggerPort {
  debug(message: string, attributes?: Readonly<Record<string, unknown>>): void;
  info(message: string, attributes?: Readonly<Record<string, unknown>>): void;
  warn(message: string, attributes?: Readonly<Record<string, unknown>>): void;
  error(message: string, attributes?: Readonly<Record<string, unknown>>): void;
}

/** No-op logger used when production logging is not wired. */
export class NoopLogger implements LoggerPort {
  debug(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}

  info(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}

  warn(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}

  error(_message: string, _attributes?: Readonly<Record<string, unknown>>): void {}
}
