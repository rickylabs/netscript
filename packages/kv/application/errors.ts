/**
 * Catchable failures from KV operations and watch streams.
 *
 * @module
 */

/** Base class for failures reported by the KV adapters. */
export class KvError extends Error {
  /**
   * Create a KV failure while retaining its original cause.
   *
   * @param message - Description of the failed operation.
   * @param options - Original cause and standard error options.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** The backend could not connect or a watch exhausted its recovery budget. */
export class KvConnectionError extends KvError {}

/** An operation or active watch failed because its adapter was closed. */
export class KvClosedError extends KvError {}

/** Why a Redis transaction cannot be confirmed after EXEC was attempted. */
export type KvAtomicCommitUnconfirmedReason =
  | 'command_failed'
  | 'malformed_result'
  | 'execution_unconfirmed';

/**
 * An attempted transaction may have applied only some mutations.
 *
 * This is not a failed version check. Do not retry non-idempotent mutations
 * without reconciling durable state. Command payloads and original errors are
 * deliberately excluded from this public failure.
 */
export class KvAtomicCommitUnconfirmedError extends KvError {
  /** Some or all mutations may already be durable. */
  readonly possiblyApplied = true;

  /**
   * Create a payload-free transaction uncertainty failure.
   *
   * @param reason - Safe classification of the missing confirmation.
   */
  constructor(readonly reason: KvAtomicCommitUnconfirmedReason) {
    super('KV atomic commit is unconfirmed; mutations may have applied.');
  }
}
