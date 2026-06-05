/** Error raised by non-binary code when the CLI should exit with a known code. */
export abstract class CliExitError extends Error {
  /** Exit code that the binary edge maps to process termination. */
  abstract readonly exitCode: number;

  /** Structured diagnostic context for renderers. */
  readonly context: Readonly<Record<string, unknown>> | undefined;

  /** Original failure when this error wraps lower-level behavior. */
  override readonly cause: unknown;

  protected constructor(
    message: string,
    options: {
      readonly cause?: unknown;
      readonly context?: Readonly<Record<string, unknown>>;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.context = options.context;
    this.cause = options.cause;
  }
}

/** User input or invocation error. */
export class UsageError extends CliExitError {
  override readonly exitCode: number;

  constructor(
    exitCode: number,
    message: string,
    options: {
      readonly cause?: unknown;
      readonly context?: Readonly<Record<string, unknown>>;
    } = {},
  ) {
    super(message, options);
    this.exitCode = exitCode;
  }
}

/** File-system, process, or local environment I/O error. */
export class IoError extends CliExitError {
  override readonly exitCode: number;

  constructor(
    exitCode: number,
    message: string,
    options: {
      readonly cause?: unknown;
      readonly context?: Readonly<Record<string, unknown>>;
    } = {},
  ) {
    super(message, options);
    this.exitCode = exitCode;
  }
}

/** Configuration loading or validation error. */
export class ConfigError extends CliExitError {
  override readonly exitCode: number;

  constructor(
    exitCode: number,
    message: string,
    options: {
      readonly cause?: unknown;
      readonly context?: Readonly<Record<string, unknown>>;
    } = {},
  ) {
    super(message, options);
    this.exitCode = exitCode;
  }
}

/** Remote command, service, or deployment target error. */
export class RemoteError extends CliExitError {
  override readonly exitCode: number;

  constructor(
    exitCode: number,
    message: string,
    options: {
      readonly cause?: unknown;
      readonly context?: Readonly<Record<string, unknown>>;
    } = {},
  ) {
    super(message, options);
    this.exitCode = exitCode;
  }
}
