import { getKv } from '@netscript/kv';
import {
  KvJobRegistry,
  KvTaskRegistry,
  type RegistryKvStore,
} from '@netscript/plugin-workers-core/registry';
import { KvExecutionState } from '@netscript/plugin-workers-core/state';
import { KvWorkerIdempotencyStore } from '../../worker/worker-idempotency-store.ts';
import type { WorkersServiceRuntime } from './routers/router-context.ts';

/** Create explicitly scoped runtime dependencies for the workers service. */
export async function createWorkersServiceRuntime(): Promise<WorkersServiceRuntime> {
  const kv = await getKv();
  // The `@netscript/kv` client structurally satisfies the registry's
  // `RegistryKvStore` port (get/set/delete/list), so it is assigned directly
  // with an explicit annotation instead of the previous `as unknown as` cast.
  const store: RegistryKvStore = kv;
  return Object.freeze({
    executionState: new KvExecutionState({ kv: store }),
    jobRegistry: new KvJobRegistry({ kv: store }),
    taskRegistry: new KvTaskRegistry({ kv: store }),
    idempotency: new KvWorkerIdempotencyStore({ kv }),
  });
}
