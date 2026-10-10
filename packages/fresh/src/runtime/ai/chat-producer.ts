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
 * rejected instead of being silently re-claimed.
 *
 * Each chunk's sequence number is its index in the turn (the `newMessages` echo
 * first, then the assistant chunks), whatever the source timing. Under one
 * `(id, epoch)` the streams service stores each index at most once: replaying
 * the same turn appends only the chunks an earlier call never stored. An index
 * that is already stored is dropped without comparing content, so reuse a pair
 * only to replay the same turn. A higher epoch starts a new sequence and does
 * not remove what an older claim stored. Use an id per turn (for example
 * `chat-turn:<sessionId>:<turnId>`) and a strictly increasing epoch per claim.
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
