/** Finite persisted relay failures; exception text never enters the row. */
export const COMMAND_RELAY_FAILURE_CLASSES: readonly [
  'rejected',
  'rate_limited',
  'unavailable',
  'timeout',
  'invalid_response',
  'misconfigured',
] = Object.freeze([
  'rejected',
  'rate_limited',
  'unavailable',
  'timeout',
  'invalid_response',
  'misconfigured',
]);
/** Persisted failure vocabulary independent of service or transport implementation. */
export type CommandRelayFailureClass = typeof COMMAND_RELAY_FAILURE_CLASSES[number];

/** Raw leased record; only service consumers decode canonical payload and trace. */
export type ClaimedCommandOutboxRow = Readonly<{
  /** Stable message identity. */
  id: string;
  /** Committed execution identity. */
  executionId: string;
  /** Registered bounded command name. */
  commandName: string;
  /** Registered positive command version. */
  commandVersion: number;
  /** Registry destination. */
  destination: string;
  /** Transport topic interpreted by its sink. */
  topic: string;
  /** Persisted canonical I-JSON. */
  payloadJson: string;
  /** Stable downstream deduplication key. */
  dedupeKey: string;
  /** Existing correlation identity, never a command attribute. */
  correlationId: string;
  /** Optional persisted W3C parent. */
  traceparent?: string;
  /** Optional persisted W3C state. */
  tracestate?: string;
  /** Count including this claim. */
  attemptCount: number;
  /** Opaque generation supplied by the injected relay identifier source. */
  claimToken: string;
  /** Ownership ends at this instant, even before a replacement claim. */
  claimUntil: Date;
}>;

/** Checked transport acceptance normalized independently of any worker/saga schema. */
export type CommandOutboxAcceptance = Readonly<{
  /** Nonempty bounded durable acceptance/run identity. */
  identity: string;
  /** Valid transport acceptance instant. */
  acceptedAt: Date;
}>;
/** Bounded lease policy and explicit injected time/generation. */
export type CommandOutboxClaim = Readonly<{
  /** Maximum rows, one through 64. */
  limit: number;
  /** Positive lease, at most one minute. */
  leaseMs: number;
  /** Detached current instant. */
  now: Date;
  /** Fresh opaque generation for this batch; each CAS also compares row id. */
  claimToken: string;
}>;
/** Publication and normalized acceptance are persisted together in one live-token CAS. */
export type CommandOutboxPublication = Readonly<{
  /** Stable message identity. */
  id: string;
  /** Current generation. */
  claimToken: string;
  /** Current instant, also used to fence lease expiry. */
  publishedAt: Date;
  /** Optional checked transport acceptance; paired identity/time, never raw receipt. */
  acceptance?: CommandOutboxAcceptance;
}>;
/** Release retains stable identities and clears only the live lease. */
export type CommandOutboxRelease =
  & Readonly<{
    /** Stable message identity. */
    id: string;
    /** Current generation. */
    claimToken: string;
    /** Actual current instant, distinct from a future retry instant. */
    now: Date;
    /** Finite failure classification. */
    failure: CommandRelayFailureClass;
  }>
  & (
    | Readonly<
      {
        /** Schedule another attempt. */ disposition: 'retry'; /** Future due instant. */
        retryAt: Date;
      }
    >
    | Readonly<
      {
        /** Retain an exhausted row. */ disposition: 'terminal'; /** Current terminal instant. */
        terminalAt: Date;
      }
    >
  );
/** Database-owned raw relay contract: no queues, decoded values or runtime DDL. */
export interface CommandOutboxRelayStore {
  /** Atomically claim only due, unpublished, nonterminal rows with expired/no ownership. */
  claim(
    request: CommandOutboxClaim,
    signal?: AbortSignal,
  ): Promise<readonly ClaimedCommandOutboxRow[]>;
  /** Publish only under live ownership, with acceptance metadata in the same write. */
  markPublished(request: CommandOutboxPublication, signal?: AbortSignal): Promise<boolean>;
  /** Retry or retain terminal state only under live ownership. */
  release(request: CommandOutboxRelease, signal?: AbortSignal): Promise<boolean>;
}
