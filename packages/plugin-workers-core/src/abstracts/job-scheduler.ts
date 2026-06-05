import type { JobDefinition } from '../domain/mod.ts';

/** Runtime dispatch context supplied to scheduled jobs. */
export interface DispatchContext {
  readonly signal?: AbortSignal;
  readonly triggeredBy: string;
  readonly correlationId?: string;
}

/** Stub-only contract for job schedulers. */
export abstract class JobScheduler {
  abstract readonly id: string;
  abstract tick(): Promise<void>;
  abstract enqueue(job: JobDefinition): Promise<void>;
  abstract dispatch(job: JobDefinition, ctx: DispatchContext): Promise<void>;
}
