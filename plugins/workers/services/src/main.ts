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
import { LEGACY_WORKERS_PUBLIC_REASON, startWorkersService } from './service.ts';

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
  return await startWorkersService(ctx, {
    auth: { public: true, reason: LEGACY_WORKERS_PUBLIC_REASON },
  });
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

export type {
  RunningService,
  RunningServiceAddress,
  ServiceApp,
  ServiceEnvironment,
} from '@netscript/service';
