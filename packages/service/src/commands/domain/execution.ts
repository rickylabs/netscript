import type { DatabaseProvider, IsolationLevel } from '@netscript/database/commands';
import type { CommandDefinition } from './definition.ts';
import type { CommandFailure } from './failure.ts';
import type { CommandEnvelope } from './values.ts';

/** Value returned only after the store has acknowledged the command boundary. */
export type CommandExecution<TOutput> = Readonly<{
  value: TOutput;
  outcome: 'applied' | 'replayed';
  idempotency: 'claimed' | 'replayed' | 'not_requested';
  correlationId: string;
}>;

/** Once-only local command execution; caller cancellation is cooperative. */
export interface CommandExecutor<TTx> {
  /** Execute one genuine definition and await commit or rollback; never retry its handler. */
  execute<TName extends string, TInput, TOutput>(
    command: CommandDefinition<TName, TInput, TOutput, TTx>,
    envelope: CommandEnvelope<TInput>,
    options?: Readonly<{ signal?: AbortSignal }>,
  ): Promise<CommandExecution<TOutput>>;
}

/** Finite, identifier-free command tracing inputs; no telemetry implementation is implied. */
export type CommandTelemetryStart = Readonly<{
  name: string;
  definitionVersion: number;
  isolation: IsolationLevel | 'default';
  provider: DatabaseProvider;
  idempotency: 'claimed' | 'not_requested';
}>;

/** Bounded command outcome vocabulary consumed by the later telemetry adapter. */
export type CommandTelemetryResult = Readonly<{
  outcome: 'applied' | 'replayed' | 'conflict' | 'rejected' | 'failed' | 'cancelled';
  idempotency: 'claimed' | 'replayed' | 'not_requested' | 'missing' | 'mismatch' | 'busy';
  auditCount: number;
  outboxCount: number;
  errorType?: CommandFailure['kind'];
}>;

/** Per-attempt synchronous record bounds, validated before the store boundary. */
export type CommandRecordLimits = Readonly<{
  /** Maximum buffered audit intents; default 64, ceiling 64, zero allowed. */
  auditRecords: number;
  /** Maximum buffered delivery intents; default 64, ceiling 64, zero allowed. */
  outboxRecords: number;
  /** Maximum aggregate canonical side-row bytes; default and ceiling 64 KiB. */
  recordBytes: number;
}>;
