import {
  type AspireBuilder,
  AspireNSPluginContribution,
  type AspireResource,
  type ContributionContext,
  type EnvSource,
  type HealthCheckSpec,
} from '@netscript/aspire/public';

const WORKERS_PLUGIN_VERSION = '0.0.1-alpha.0';

const WORKERS_SERVICE_PERMISSIONS = [
  '--unstable-kv',
  '--allow-net',
  '--allow-env',
  '--allow-read',
  '--allow-write',
  '--allow-run',
] as const;

const WORKERS_BACKGROUND_PERMISSIONS = [
  '--unstable-kv',
  '--allow-net',
  '--allow-env',
  '--allow-read',
  '--allow-write',
  '--allow-run',
  '--allow-sys',
  '--allow-ffi',
] as const;

/** Aspire contribution for the NetScript workers plugin. */
export class WorkersAspireContribution extends AspireNSPluginContribution {
  /** Plugin package name owning this contribution. */
  readonly pluginName = '@netscript/plugin-workers';

  /** Register workers API and background runtime resources with the AppHost builder. */
  contribute(
    builder: AspireBuilder,
    ctx: ContributionContext,
  ): readonly AspireResource[] {
    const api = builder.addDenoService('workers-api', {
      workdir: ctx.projectRoot,
      entrypoint: 'plugins/workers/services/src/main.ts',
      port: ctx.port('workers-api', 8091),
      permissions: WORKERS_SERVICE_PERMISSIONS,
      env: {
        WORKERS_PLUGIN_VERSION,
      },
    });

    const combined = builder.addDenoBackground('workers-combined', {
      workdir: ctx.projectRoot,
      entrypoint: 'plugins/workers/bin/combined.ts',
      permissions: WORKERS_BACKGROUND_PERMISSIONS,
      concurrencyEnvVar: 'WORKER_CONCURRENCY',
      watchMode: true,
    });

    const scheduler = builder.addDenoBackground('workers-scheduler', {
      workdir: ctx.projectRoot,
      entrypoint: 'plugins/workers/bin/scheduler.ts',
      permissions: WORKERS_BACKGROUND_PERMISSIONS,
      watchMode: true,
    });

    const worker = builder.addDenoBackground('workers-worker', {
      workdir: ctx.projectRoot,
      entrypoint: 'plugins/workers/bin/worker.ts',
      permissions: WORKERS_BACKGROUND_PERMISSIONS,
      concurrencyEnvVar: 'WORKER_CONCURRENCY',
      watchMode: true,
    });

    return [api, combined, scheduler, worker];
  }

  /** Declare environment values used by workers Aspire resources. */
  override declareEnv(_ctx: ContributionContext): Record<string, EnvSource | string> {
    return {
      WORKERS_API_URL: 'http://localhost:8091',
      WORKER_CONCURRENCY: '2',
    };
  }

  /** Declare health checks used by plugin doctor commands. */
  override declareHealthChecks(_ctx: ContributionContext): readonly HealthCheckSpec[] {
    return [{
      resource: 'workers-api',
      url: 'http://localhost:8091/health',
      expect: 200,
      timeoutMs: 3000,
    }];
  }
}
