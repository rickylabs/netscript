import { assertEquals } from 'jsr:@std/assert@^1';
import { MemoryKvAdapter } from '@netscript/kv';
import { KvJobRegistry, KvTaskRegistry } from '@netscript/plugin-workers-core/registry';
import { KvExecutionState } from '@netscript/plugin-workers-core/state';
import { KvWorkerIdempotencyStore } from '@netscript/plugin-workers-core/stores';
import workersPackageJson from '../../deno.json' with { type: 'json' };
import type { WorkersServiceRuntime } from './routers/router-context.ts';
import {
  registerPluginJobs,
  WORKERS_PLUGIN_HEALTH_CHECK_ENTRYPOINT,
  WORKERS_PLUGIN_HEALTH_CHECK_JOB_ID,
  WORKERS_PLUGIN_HEALTH_CHECK_SOURCE_URL,
} from './init.ts';

Deno.test('registerPluginJobs stores the built-in health job with the package source URL', async () => {
  await using kv = new MemoryKvAdapter();
  const runtime = createTestRuntime(kv);

  await registerPluginJobs(runtime);

  const job = await runtime.jobRegistry.get(WORKERS_PLUGIN_HEALTH_CHECK_JOB_ID);
  assertEquals(job?.entrypoint, WORKERS_PLUGIN_HEALTH_CHECK_ENTRYPOINT);
  assertEquals(job?.sourceUrl, WORKERS_PLUGIN_HEALTH_CHECK_SOURCE_URL);
  assertEquals(
    job?.sourceUrl,
    `jsr:@netscript/plugin-workers@${workersPackageJson.version}/jobs/health-check.ts`,
  );
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

Deno.test('workers plugin export map exposes the built-in health job sourceUrl subpath', async () => {
  const denoJson = JSON.parse(await Deno.readTextFile(new URL('../../deno.json', import.meta.url)));
  if (!isRecord(denoJson) || !isRecord(denoJson.exports)) {
    throw new Error('plugins/workers/deno.json is missing an exports object');
  }

  const sourceUrlSubpath = WORKERS_PLUGIN_HEALTH_CHECK_SOURCE_URL.replace(
    `jsr:@netscript/plugin-workers@${workersPackageJson.version}`,
    '.',
  );

  assertEquals(sourceUrlSubpath, './jobs/health-check.ts');
  assertEquals(denoJson.exports[sourceUrlSubpath], WORKERS_PLUGIN_HEALTH_CHECK_ENTRYPOINT);
});

function createTestRuntime(kv: MemoryKvAdapter): WorkersServiceRuntime {
  return Object.freeze({
    executionState: new KvExecutionState({ kv }),
    jobRegistry: new KvJobRegistry({ kv }),
    taskRegistry: new KvTaskRegistry({ kv }),
    idempotency: new KvWorkerIdempotencyStore({ kv }),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
