import { assertEquals } from 'jsr:@std/assert@^1';
import { MemoryKvAdapter } from '@netscript/kv';
import { KvJobRegistry, KvTaskRegistry } from '@netscript/plugin-workers-core/registry';
import { KvExecutionState } from '@netscript/plugin-workers-core/state';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import type { WorkersServiceRuntime } from './routers/router-context.ts';
import {
  registerPluginJobs,
  WORKERS_PLUGIN_HEALTH_CHECK_ENTRYPOINT,
  WORKERS_PLUGIN_HEALTH_CHECK_JOB_ID,
  WORKERS_PLUGIN_HEALTH_CHECK_SOURCE_URL,
} from './init.ts';

Deno.test('registerPluginJobs stores the built-in health job with the published package source URL', async () => {
  await using kv = new MemoryKvAdapter();
  const runtime = createTestRuntime(kv);

  await registerPluginJobs(runtime);

  const job = await runtime.jobRegistry.get(WORKERS_PLUGIN_HEALTH_CHECK_JOB_ID);
  assertEquals(job?.entrypoint, WORKERS_PLUGIN_HEALTH_CHECK_ENTRYPOINT);
  assertEquals(job?.sourceUrl, WORKERS_PLUGIN_HEALTH_CHECK_SOURCE_URL);
  assertEquals(job?.source, 'plugin');
  assertEquals(job?.pluginId, 'workers');
});

Deno.test('registerPluginJobs repairs stale project-local built-in health job rows', async () => {
  await using kv = new MemoryKvAdapter();
  const runtime = createTestRuntime(kv);
  await runtime.jobRegistry.registerJob({
    id: WORKERS_PLUGIN_HEALTH_CHECK_JOB_ID,
    name: 'Workers Health Check',
    entrypoint: './plugins/workers/jobs/health-check.ts',
    source: 'plugin',
    pluginId: 'workers',
    executionType: 'deno',
  });

  await registerPluginJobs(runtime);

  const job = await runtime.jobRegistry.get(WORKERS_PLUGIN_HEALTH_CHECK_JOB_ID);
  assertEquals(job?.entrypoint, WORKERS_PLUGIN_HEALTH_CHECK_ENTRYPOINT);
  assertEquals(job?.sourceUrl, WORKERS_PLUGIN_HEALTH_CHECK_SOURCE_URL);
});

function createTestRuntime(kv: MemoryKvAdapter): WorkersServiceRuntime {
  return Object.freeze({
    executionState: new KvExecutionState({ kv }),
    jobRegistry: new KvJobRegistry({ kv }),
    taskRegistry: new KvTaskRegistry({ kv }),
    idempotency: new KvWorkerIdempotencyStore({ kv }),
  });
}
