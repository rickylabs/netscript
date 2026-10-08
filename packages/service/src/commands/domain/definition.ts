import type { IsolationLevel } from '@netscript/database';
import type { CommandCodec } from './codec.ts';
import type { CommandActor, CommandEnvelope, CommandJson } from './values.ts';

/** Internal binding key, exported as a type only from the public command manifest. */
export const commandDefinitionBinding: unique symbol = Symbol('command-definition-binding');

/** Internal executor capability, exported as a type only from the public command manifest. */
export const commandExecutorCapability: unique symbol = Symbol('command-executor-capability');

/** Whether a definition requires the caller to supply an idempotency key. */
export type CommandIdempotencyMode = 'required' | 'optional';

/** Whether a handler must, may, or must never emit a side record. */
export type CommandRecordRequirement = 'required' | 'optional' | 'forbidden';

/** Semantic request identity and replay codec, independent of transport-only fields. */
export type CommandIdempotency<TInput, TOutput> = Readonly<{
  mode: CommandIdempotencyMode;
  scope(identity: Readonly<{ input: TInput; actor: CommandActor }>): string;
  fingerprint(input: TInput): CommandJson;
  response: CommandCodec<TOutput>;
}>;

/** Definition-time idempotency configuration; omitting mode selects required. */
export type CommandIdempotencySpec<TInput, TOutput> =
  & Omit<CommandIdempotency<TInput, TOutput>, 'mode'>
  & Readonly<{ mode?: CommandIdempotencyMode }>;

/** Redacted application-owned audit intent buffered by a command handler. */
export type CommandAuditInput = Readonly<{
  action: string;
  subject: Readonly<{ type: string; id: string }>;
  data?: CommandJson;
}>;

/** Delivery intent; recording it performs no transport work. */
export type CommandOutboxInput<TPayload> = Readonly<{
  destination: string;
  topic: string;
  payload: TPayload;
  codec: CommandCodec<TPayload>;
  dedupeKey?: string;
  availableAt?: Date;
}>;

/** Transaction-bound handler context; clocks, identifiers and recorders belong to the executor. */
export interface CommandContext<TInput, TTx> {
  /** True caller transaction handle. */
  readonly tx: TTx;
  /** Frozen input and transport identity. */
  readonly envelope: CommandEnvelope<TInput>;
  /** Cooperative cancellation. */
  readonly signal: AbortSignal;
  /** Read the executor clock. */
  now(): Date;
  /** Obtain a fresh executor identifier. */
  newId(): string;
  /** Buffer an audit intent without IO. */
  audit(record: CommandAuditInput): void;
  /** Buffer a delivery intent without IO. */
  publish<TPayload>(message: CommandOutboxInput<TPayload>): void;
  /** Throw an optimistic command conflict. */
  conflict(): never;
}

/** Specification consumed once by defineCommand; the handler is absent from its public result. */
export type CommandDefinitionSpec<TName extends string, TInput, TOutput, TTx> = Readonly<{
  name: TName;
  definitionVersion: number;
  isolationLevel?: IsolationLevel;
  idempotency: CommandIdempotencySpec<TInput, TOutput>;
  records: Readonly<{ audit: CommandRecordRequirement; outbox: CommandRecordRequirement }>;
  handle(context: CommandContext<TInput, TTx>): Promise<TOutput>;
}>;

/** Opaque immutable definition; only the original object has a private handler binding. */
export interface CommandDefinition<TName extends string, TInput, TOutput, TTx> {
  /** Durable name; changing it changes the receipt namespace. */
  readonly name: TName;
  /** Replay compatibility version; changes invalidate old requests under the same key. */
  readonly definitionVersion: number;
  /** Optional database-owned isolation vocabulary. */
  readonly isolationLevel?: IsolationLevel;
  /** Frozen semantic identity callbacks and response codec. */
  readonly idempotency: CommandIdempotency<TInput, TOutput>;
  /** Frozen audit/outbox requirements. */
  readonly records: Readonly<{ audit: CommandRecordRequirement; outbox: CommandRecordRequirement }>;
  /** Type-only opaque marker; its runtime key is unavailable from public exports. */
  readonly [commandDefinitionBinding]: (
    capability: typeof commandExecutorCapability,
    original: CommandDefinition<TName, TInput, TOutput, TTx>,
  ) => (context: CommandContext<TInput, TTx>) => Promise<TOutput>;
}
