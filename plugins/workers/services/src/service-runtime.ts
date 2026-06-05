import { getKv } from '@netscript/kv';
import {
  KvJobRegistry,
  KvTaskRegistry,
  type RegistryKvStore,
} from '@netscript/plugin-workers-core/registry';
import { KvExecutionState } from '@netscript/plugin-workers-core/state';
import type { WorkersServiceRuntime } from './routers/router-context.ts';

/** Create explicitly scoped runtime dependencies for the workers service. */
export async function createWorkersServiceRuntime(): Promise<WorkersServiceRuntime> {
  const kv = await getKv();
  const store = kv as unknown as RegistryKvStore;
  return Object.freeze({
    executionState: new KvExecutionState({ kv: store }),
    jobRegistry: new KvJobRegistry({ kv: store }),
    taskRegistry: new KvTaskRegistry({ kv: store }),
  });
}
