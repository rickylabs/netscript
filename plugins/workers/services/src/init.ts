import { emitJobToStream } from '../../streams/server.ts';
import type { WorkersServiceRuntime } from './routers/router-context.ts';

export const WORKERS_PLUGIN_HEALTH_CHECK_JOB_ID = 'workers-plugin-health-check';
export const WORKERS_PLUGIN_HEALTH_CHECK_ENTRYPOINT = './jobs/health-check.ts';
export const WORKERS_PLUGIN_HEALTH_CHECK_SOURCE_URL =
  'jsr:@netscript/plugin-workers/jobs/health-check.ts';

/**
 * Register jobs defined in the workers plugin.
 * This runs once on service startup.
 */
export async function registerPluginJobs(runtime: WorkersServiceRuntime): Promise<void> {
  const registry = runtime.jobRegistry;
  // Jobs defined in the workers plugin
  // Built-in plugin jobs use sourceUrl so thin consuming apps can execute the
  // published plugin module without copying plugin source into ./plugins.
  const pluginJobs = [
    {
      id: WORKERS_PLUGIN_HEALTH_CHECK_JOB_ID,
      name: 'Workers Health Check',
      description: 'Periodic health check of the workers system',
      entrypoint: WORKERS_PLUGIN_HEALTH_CHECK_ENTRYPOINT,
      sourceUrl: WORKERS_PLUGIN_HEALTH_CHECK_SOURCE_URL,
      schedule: '*/5 * * * *',
      timezone: 'UTC',
      timeout: 30000,
      maxRetries: 1,
      enabled: true,
      tags: ['system', 'health', 'monitoring', 'workers-plugin'],
      source: 'plugin' as const,
      pluginId: 'workers',
      executionType: 'deno' as const,
      retryDelay: 1000,
      maxConcurrency: 1,
      persist: true,
      priority: 50,
      topic: 'default',
      permissions: {
        net: false,
        read: true,
        write: false,
        env: true,
        run: false,
        ffi: false,
      },
    },
  ];

  console.log('[Workers Plugin] Registering plugin jobs...');

  for (const job of pluginJobs) {
    try {
      // Check if job already exists
      const existing = await registry.get(job.id);
      if (existing) {
        // Check if entrypoint, source URL, source, or permissions need to be fixed.
        const entrypointChanged = existing.entrypoint !== job.entrypoint;
        const sourceUrlChanged = existing.sourceUrl !== job.sourceUrl;
        const sourceChanged = existing.source !== job.source;
        const permissionsChanged =
          JSON.stringify(existing.permissions) !== JSON.stringify(job.permissions);

        if (entrypointChanged || sourceUrlChanged || sourceChanged || permissionsChanged) {
          console.log(
            `[Workers Plugin] Updating job '${job.id}' (entrypoint: ${entrypointChanged}, sourceUrl: ${sourceUrlChanged}, source: ${sourceChanged}, permissions: ${permissionsChanged})...`,
          );
          console.log(`[Workers Plugin]   Old entrypoint: ${existing.entrypoint}`);
          console.log(`[Workers Plugin]   New entrypoint: ${job.entrypoint}`);
          console.log(`[Workers Plugin]   Old sourceUrl: ${existing.sourceUrl}`);
          console.log(`[Workers Plugin]   New sourceUrl: ${job.sourceUrl}`);
          console.log(`[Workers Plugin]   Old source: ${existing.source}`);
          console.log(`[Workers Plugin]   New source: ${job.source}`);
          await registry.unregister(job.id);
          await registry.registerJob(job);
          console.log(`[Workers Plugin] ✅ Re-registered job '${job.id}'`);
        } else {
          console.log(`[Workers Plugin] Job '${job.id}' already registered correctly, skipping`);
        }
        continue;
      }

      await registry.registerJob(job);
      console.log(`[Workers Plugin] ✅ Registered job '${job.id}'`);
    } catch (error) {
      console.error(`[Workers Plugin] ❌ Failed to register job '${job.id}':`, error);
    }
  }

  // List all registered jobs and publish to durable stream
  const allJobs = await registry.list();
  console.log(`[Workers Plugin] Total jobs in registry: ${allJobs.length}`);
  for (const job of allJobs) {
    const scheduleInfo = job.schedule ? `[${job.schedule}]` : '[on-demand]';
    console.log(`[Workers Plugin]   - ${job.id}: ${job.name} ${scheduleInfo}`);

    // Publish job entity to the durable stream so stream consumers see it
    try {
      emitJobToStream({
        id: job.id,
        name: job.name,
        topic: job.topic,
        enabled: job.enabled,
        schedule: job.schedule,
        description: job.description,
      });
    } catch (e) {
      console.warn(`[Workers Plugin] Failed to publish job '${job.id}' to stream:`, e);
    }
  }
}
