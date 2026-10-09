import type {
  CommandOutboxAcceptance,
  CommandOutboxRelayStore,
  CommandRelayFailureClass,
  DatabaseProvider,
} from '@netscript/database/commands';
import type { CommandJson, CommandTraceContext } from '../domain/values.ts';
import type { CommandTelemetryStart } from '../domain/execution.ts';
import type {
  CommandClock,
  CommandIdSource,
  CommandTelemetrySpan,
} from '../ports/executor-ports.ts';

/** Decoded canonical delivery; stable transport identities never enter command attributes. */
export type CommandOutboxDelivery = Readonly<{
  /** Stable outbox message identity. */ id: string;
  /** Configured sink registry key. */ destination: string;
  /** Transport topic interpreted by its sink. */ topic: string;
  /** Frozen bounded canonical I-JSON. */ payload: CommandJson;
  /** Stable downstream deduplication identity. */ dedupeKey: string;
  /** Existing correlation identity. */ correlationId: string;
  /** Validated W3C propagation context. */ trace?: CommandTraceContext;
}>;
/** Sink acceptance is its documented boundary, followed by relay settlement. */
export interface CommandOutboxSink {
  /** Registry identity captured during composition. */ readonly id: string;
  /** Publish once; worker sinks must return checked normalized acceptance. */
  publish(
    message: CommandOutboxDelivery,
    signal?: AbortSignal,
  ): Promise<void | CommandOutboxAcceptance>;
}
/** Structurally compatible privacy-safe C4 relay/publish observer extension. */
export interface CommandRelayTelemetryPort {
  /** Observe one decoded delivery without changing operation result or error. */
  traceRelay<T>(
    start: CommandTelemetryStart,
    operation: (span: CommandTelemetrySpan) => Promise<T>,
  ): Promise<T>;
  /** Observe its documented transport acceptance boundary. */
  tracePublish<T>(
    start: CommandTelemetryStart,
    operation: (span: CommandTelemetrySpan) => Promise<T>,
  ): Promise<T>;
}
/** Explicit finite lifecycle policy; composition performs no IO or scheduling. */
export type CommandOutboxRelayOptions = Readonly<{
  /** Database-owned raw leases and settlement. */ store: CommandOutboxRelayStore;
  /** Registry copied and validated at composition. */ sinks: ReadonlyMap<
    string,
    CommandOutboxSink
  >;
  /** Explicit clock. */ clock: CommandClock;
  /** Fresh lease generations, never reused across drains. */ ids: CommandIdSource;
  /** Maximum claim size, one through 64. */ batchSize: number;
  /** Maximum simultaneous publishers, one through batchSize; overlapping drains serialize. */ concurrency:
    number;
  /** Lease milliseconds, one through 60,000. */ leaseMs: number;
  /** Maximum attempts, one through 10,000. */ maxAttempts: number;
  /** Retry delay ceiling, one through 86,400,000 milliseconds. */ maxRetryDelayMs: number;
  /** Classify unstructured sink errors into the closed persisted vocabulary. */ classify(
    error: unknown,
  ): CommandRelayFailureClass;
  /** Select a future retry within the explicit ceiling; invalid policy retains terminal misconfigured. */ retryAt(
    attempt: number,
    now: Date,
  ): Date;
  /** Optional privacy-safe native tracing observer. */ telemetry?: CommandRelayTelemetryPort;
  /** Explicit provider identity when telemetry is supplied. */ provider?: DatabaseProvider;
}>;
/** Explicit drain lifecycle; stopping aborts new work and awaits every active/queued drain. */
export interface RunningCommandOutboxRelay {
  /** Return the number settled published in this bounded drain; stopped/aborted queued drains return zero. */
  drainOnce(signal?: AbortSignal): Promise<number>;
  /** Idempotently stop new claims, signal publishers and await their completion. */
  stop(): Promise<void>;
}
