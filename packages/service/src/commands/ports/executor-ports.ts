import type { CommandStorePort } from '@netscript/database/commands';
import type {
  CommandRecordLimits,
  CommandTelemetryResult,
  CommandTelemetryStart,
} from '../domain/execution.ts';

/** Clock injected at the composition root, never read by semantic identity callbacks. */
export interface CommandClock {
  /** Return a valid instant; the executor detaches each Date. */
  now(): Date;
}

/** Unique identifiers injected at the composition root. */
export interface CommandIdSource {
  /** Return a fresh nonempty UTF-8 identifier of at most 256 bytes. */
  next(): string;
}

/** Completion of one command tracing operation after its store boundary. */
export interface CommandTelemetrySpan {
  /** Record only the finite outcome, counts and optional bounded failure kind. */
  finish(result: CommandTelemetryResult): void;
}

/** Optional tracing extension; implementations must invoke operation once and preserve errors. */
export interface CommandTelemetryPort {
  /** Trace the once-only operation without changing its returned value or error identity. */
  trace<TResult>(
    start: CommandTelemetryStart,
    operation: (span: CommandTelemetrySpan) => Promise<TResult>,
  ): Promise<TResult>;
}

/** Production composition ports and bounded policy; fault controls are deliberately absent. */
export type CommandExecutorOptions<TTx> = Readonly<{
  /** Same-commit interactive store with callbackAttempts one. */
  store: CommandStorePort<TTx>;
  /** Defaults to the system clock. */
  clock?: CommandClock;
  /** Defaults to crypto.randomUUID. */
  ids?: CommandIdSource;
  /** Optional finite command tracing extension. */
  telemetry?: CommandTelemetryPort;
  /** Store-advertised bounded wait; defaults to its minimum. */
  receiptClaimWaitMs?: number;
  /** Record buffer bounds; the transaction additionally has a finite five-second timeout. */
  limits?: CommandRecordLimits;
}>;
