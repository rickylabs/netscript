import { workersContractV1 } from '../../../contracts/v1/mod.ts';
import type { JobMessage, TaskMessage } from '@netscript/plugin-workers-core/runtime';
import type { KvJobRegistry, KvTaskRegistry } from '@netscript/plugin-workers-core/registry';
import type { KvExecutionState } from '@netscript/plugin-workers-core/state';
import type { KvWorkerIdempotencyStore } from '../../../worker/worker-idempotency-store.ts';
import { createQueue } from '@netscript/queue';

/**
 * Host-provided database client handed to the workers service.
 *
 * The plugin-thinness law forbids the connector from importing the host's
 * database package, so the host resolves the client through
 * `PluginServiceContext.db.getClient(): Promise<unknown>` and the workers
 * service treats it as opaque. Typing it `unknown` (rather than the previous
 * `Record<string, unknown>`, which falsely asserted a string-keyed record) is
 * the sound representation: handlers that need it must narrow explicitly.
 */
export type WorkerDatabaseClient = unknown;

export type WorkersServiceRuntime = Readonly<{
  executionState: KvExecutionState;
  jobRegistry: KvJobRegistry;
  taskRegistry: KvTaskRegistry;
  idempotency: KvWorkerIdempotencyStore;
}>;

/**
 * Per-request oRPC handler context for the workers service.
 *
 * `db` is the opaque host client (see {@link WorkerDatabaseClient}); `workers`
 * is the fully-typed runtime the connector owns; `traceHeaders` carries
 * propagated W3C trace context. Every field the connector owns is precisely
 * typed.
 */
export type WorkersRequestContext = {
  db: WorkerDatabaseClient;
  traceHeaders?: { traceparent?: string; tracestate?: string };
  workers: WorkersServiceRuntime;
};

type WorkersRouterContext = ReturnType<typeof workersContractV1.$context<WorkersRequestContext>>;

const workersRouter: WorkersRouterContext = workersContractV1.$context<WorkersRequestContext>();

export const router: typeof workersRouter = workersRouter;

/**
 * Precise type of a contract-bound handler map slice.
 *
 * Each handler value is exactly the `ImplementedProcedure` that
 * `router[K].handler(...)` produces — its input/output schemas, context, and
 * error map are derived from the workers contract, not hand-authored. Splitting
 * the handlers across modules forces them to be `export`ed, which means JSR
 * `--isolatedDeclarations` requires an explicit annotation; this mapped type is
 * that annotation while preserving per-route precision (no `any`, no
 * `Record<string, unknown>` erasure).
 */
export type WorkersHandlers<K extends keyof typeof router> = {
  [P in K]: (typeof router)[P] extends { handler: (...args: never[]) => infer R } ? R
    : never;
};

export function getWorkersRuntime(context: unknown): WorkersServiceRuntime {
  const runtime = (context as Partial<WorkersRequestContext>).workers;
  if (!runtime) {
    throw new Error('Workers service runtime missing from request context.');
  }
  return runtime;
}

let jobQueue: ReturnType<typeof createQueue<JobMessage>> | null = null;
let taskQueue: ReturnType<typeof createQueue<TaskMessage>> | null = null;

export function getJobQueue(): ReturnType<typeof createQueue<JobMessage>> {
  if (!jobQueue) {
    jobQueue = createQueue<JobMessage>('jobs');
  }
  return jobQueue;
}

export function getTaskQueue(): ReturnType<typeof createQueue<TaskMessage>> {
  if (!taskQueue) {
    taskQueue = createQueue<TaskMessage>('tasks');
  }
  return taskQueue;
}
