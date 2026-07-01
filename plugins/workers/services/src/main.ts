/**
 * Workers Service
 *
 * oRPC-based Workers API service for job management, execution tracking,
 * and SSE streaming.
 *
 * Features:
 * - oRPC type-safe API
 * - OpenAPI documentation
 * - SSE streaming with eventIterator
 * - OpenTelemetry tracing with trace context propagation
 *
 * @module
 */

// Register Redis/Garnet KV adapter - must run before any getKv() call.
import '@netscript/kv/redis';

import type { PluginServiceContext } from '@netscript/plugin/sdk';
import type { RunningService } from '@netscript/service';
import { createPluginService } from '@netscript/plugin/service';
import { router } from './router.ts';
import { registerPluginJobs } from './init.ts';
import { registerGeneratedJobDefinitions } from './generated-jobs.ts';
import { projectFileUrl, WORKERS_JOB_REGISTRY_PATH } from '../../src/runtime/generated-jobs.ts';
import { createStreamMutationHook } from '../../streams/server.ts';
import { createWorkersServiceRuntime } from './service-runtime.ts';

export type { PluginServiceContext } from '@netscript/plugin/sdk';

type PluginServiceBootstrap = {
  createPluginServiceContext(pluginName: string): Promise<PluginServiceContext>;
};

/**
 * Starts the Workers API service using host-provided infrastructure.
 *
 * The plugin service receives host-owned runtime context without importing the
 * host application's database package. Workers routes store their mutable state
 * in KV-backed registries, so the opaque database client is not resolved on the
 * liveness path.
 *
 * @param ctx - Host-provided plugin service context
 */
export default async function createWorkersService(
  ctx: PluginServiceContext,
): Promise<RunningService> {
  const port = parseInt(ctx.env.PORT ?? Deno.env.get('PORT') ?? '8091');
  const runtime = await createWorkersServiceRuntime();
  await registerPluginJobs(runtime);
  await registerGeneratedJobDefinitions(runtime, projectFileUrl(WORKERS_JOB_REGISTRY_PATH));

  const running = await createPluginService(router, {
    name: 'workers',
    version: '1.0.0',
    port,
    openApi: {
      title: 'Workers API',
      description: 'Workers service for job management and execution',
    },
    context: () => ({ workers: runtime }),
  }).serve();

  queueMicrotask(() => {
    try {
      runtime.executionState.setMutationHook(createStreamMutationHook());

      console.log(
        `Subscribe: http://localhost:${port}/api/v1/workers/subscribe (KV watch SSE)`,
      );
    } catch (error) {
      console.error('[Workers Plugin] Failed to finish post-listen startup:', error);
    }
  });

  return running;
}

async function loadWorkersServiceContext(): Promise<PluginServiceContext> {
  const bootstrapModule = Deno.env.get('NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE');
  if (!bootstrapModule) {
    throw new Error(
      'NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE is required to start workers service directly.',
    );
  }

  const { createPluginServiceContext } = await import(bootstrapModule) as PluginServiceBootstrap;
  return createPluginServiceContext('workers');
}

if (import.meta.main) {
  const ctx = await loadWorkersServiceContext();
  await createWorkersService(ctx);
}
