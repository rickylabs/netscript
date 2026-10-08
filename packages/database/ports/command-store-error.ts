/** Provider-owned bounded failures; driver codes and messages stay in the trusted cause. */
export type CommandStoreFailure =
  | Readonly<
    {
      kind: 'store_failure';
      retryable: boolean;
      phase: 'begin' | 'claim' | 'business' | 'flush' | 'complete' | 'commit';
    }
  >
  | Readonly<{ kind: 'aborted'; retryable: true }>
  | Readonly<{ kind: 'receipt_corrupt'; retryable: false }>;

/**
 * Raw adapter failure translated by the application without inspecting driver text.
 *
 * Busy is a terminal claim result, not an exception from this class. Adapters preserve arbitrary
 * callback errors and only classify their own acquisition, driver and boundary failures.
 *
 * @example
 * ```ts
 * import { CommandStoreError } from '@netscript/database/commands';
 * throw new CommandStoreError({ kind: 'store_failure', retryable: true, phase: 'commit' });
 * ```
 */
export class CommandStoreError extends Error {
  /** Safe provider classification; contains no driver diagnostics or request material. */
  readonly failure: CommandStoreFailure;

  /** Validate the bounded raw failure and keep its optional diagnostic cause private. */
  constructor(failure: CommandStoreFailure, options?: ErrorOptions) {
    super('[netscript.command.store] provider failure', options);
    this.name = 'CommandStoreError';
    if (
      failure.kind === 'store_failure' && typeof failure.retryable === 'boolean' &&
      ['begin', 'claim', 'business', 'flush', 'complete', 'commit'].includes(failure.phase)
    ) {
      this.failure = Object.freeze({
        kind: failure.kind,
        retryable: failure.retryable,
        phase: failure.phase,
      });
    } else if (failure.kind === 'aborted' && failure.retryable === true) {
      this.failure = Object.freeze({ kind: failure.kind, retryable: true });
    } else if (failure.kind === 'receipt_corrupt' && failure.retryable === false) {
      this.failure = Object.freeze({ kind: failure.kind, retryable: false });
    } else throw new TypeError('[netscript.command.store] invalid bounded provider failure');
    Object.freeze(this);
  }

  /** Serialize only the bounded failure vocabulary. */
  toJSON(): CommandStoreFailure {
    return this.failure;
  }
}
