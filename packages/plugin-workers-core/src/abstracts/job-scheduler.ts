import type { JobDefinition } from '../runtime/runtime-types.ts';

/** Runtime dispatch context supplied to scheduled jobs. */
export interface DispatchContext {
  /** Cancellation signal for the dispatch attempt. */
  readonly signal?: AbortSignal;
  /** Source that triggered the dispatch. */
  readonly triggeredBy: string;
  /** Correlation identifier propagated across dispatch. */
  readonly correlationId?: string;
}

/** Stub-only contract for job schedulers. */
export abstract class JobScheduler {
  /** Stable scheduler identifier. */
  abstract readonly id: string;
  /** Run one scheduler tick. */
  abstract tick(): Promise<void>;
  /** Enqueue a job for future dispatch. */
  abstract enqueue(job: JobDefinition): Promise<void>;
  /** Dispatch a job immediately with context. */
  abstract dispatch(job: JobDefinition, ctx: DispatchContext): Promise<void>;
}
