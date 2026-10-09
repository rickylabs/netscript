/**
 * Writer-identity contract for fenced durable chat appends (#2067).
 *
 * A chat executor that may be reclaimed (a worker or saga whose lease expired
 * and whose turn was handed to a new claim) names itself with a
 * {@link NetScriptChatProducer}. Every append it makes then carries the
 * durable-streams idempotent-producer tuple `(id, epoch, seq)`, so the streams
 * runtime rejects a zombie writer whose epoch is older than the newest one that
 * has written, and surfaces the rejection as a {@link NetScriptChatProducerError}.
 *
 * @module
 */

/**
 * Caller-supplied writer identity for one fenced durable chat turn.
 *
 * The framework never derives, claims, or bumps an epoch: the executor supplies
 * the epoch from its own lease or claim generation, and a stale epoch is
 * rejected instead of being silently re-claimed. One `(id, epoch)` pair names
 * exactly one writer for one `toNetScriptChatResponse` call — sequences
 * restart at `0` for every call, so reusing a pair makes the server treat the
 * new appends as duplicates of the earlier ones and drop them. Use an id that is
 * stable across retries of one turn (for example `chat-turn:<sessionId>:<turnId>`)
 * and a strictly increasing epoch per claim of that turn.
 */
export interface NetScriptChatProducer {
  /** Stable, opaque writer id: the executor's service identity for this turn. */
  readonly id: string;
  /** Non-negative integer epoch, derived from the executor's lease or claim generation. */
  readonly epoch: number;
}

/** Construction input for {@link NetScriptChatProducerError}. */
interface NetScriptChatProducerErrorInit {
  readonly kind: NetScriptChatProducerError['kind'];
  readonly producer: NetScriptChatProducer;
  readonly message: string;
  readonly currentEpoch?: number;
}

/**
 * Typed failure of a fenced durable chat append.
 *
 * `kind` uses the same failure vocabulary as State Protocol producers in
 * `@netscript/plugin-streams-core`; `'stale-epoch'` means a newer writer has
 * claimed the turn and nothing from this writer's rejected appends was stored.
 *
 * @example
 * ```ts
 * import { NetScriptChatProducerError } from '@netscript/fresh/ai';
 *
 * const error = new NetScriptChatProducerError({
 *   kind: 'stale-epoch',
 *   producer: { id: 'chat-turn:s1:t1', epoch: 1 },
 *   message: 'Stale producer epoch',
 *   currentEpoch: 2,
 * });
 * console.log(error.kind === 'stale-epoch' && error.currentEpoch === 2);
 * ```
 */
export class NetScriptChatProducerError extends Error {
  /**
   * Stable failure category; the same set as `StreamProducerTransportFailureKindV1`
   * in `@netscript/plugin-streams-core` (a compile-time check keeps them equal).
   */
  readonly kind:
    | 'retryable'
    | 'stale-epoch'
    | 'sequence-gap'
    | 'stream-closed'
    | 'non-retryable'
    | 'aborted';
  /** Writer id whose append failed. */
  readonly producerId: string;
  /** Epoch the failed append was made under. */
  readonly epoch: number;
  /** Current server epoch reported with a `'stale-epoch'` rejection. */
  readonly currentEpoch?: number;

  /**
   * Create a typed chat producer failure.
   *
   * @param init Failure category, writer identity, message, and optional current epoch.
   * @param options Standard error options; `cause` keeps the upstream error.
   */
  constructor(init: NetScriptChatProducerErrorInit, options?: ErrorOptions) {
    super(init.message, options);
    this.name = 'NetScriptChatProducerError';
    this.kind = init.kind;
    this.producerId = init.producer.id;
    this.epoch = init.producer.epoch;
    if (init.currentEpoch !== undefined) this.currentEpoch = init.currentEpoch;
  }
}
