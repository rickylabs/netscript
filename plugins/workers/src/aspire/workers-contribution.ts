import {
  type AspireBuilder,
  AspireNSPluginContribution,
  type AspireResource,
  type ContributionContext,
  type EnvSource,
  type HealthCheckSpec,
} from '@netscript/aspire/public';

const WORKERS_PLUGIN_VERSION = '0.0.1-alpha.0';
const WORKERS_API_RESOURCE = 'workers-api';
const WORKERS_COMBINED_RESOURCE = 'workers-combined';

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
    const apiPort = ctx.port(WORKERS_API_RESOURCE);
    const api = builder.addDenoService(WORKERS_API_RESOURCE, {
      workdir: ctx.projectRoot,
      entrypoint: 'plugins/workers/services/src/main.ts',
      port: apiPort,
      permissions: WORKERS_SERVICE_PERMISSIONS,
      env: {
        WORKERS_PLUGIN_VERSION,
      },
    });

    const combined = builder.addDenoBackground(WORKERS_COMBINED_RESOURCE, {
      workdir: ctx.projectRoot,
      entrypoint: 'plugins/workers/bin/combined.ts',
      permissions: WORKERS_BACKGROUND_PERMISSIONS,
      concurrencyEnvVar: 'WORKER_CONCURRENCY',
      watchMode: true,
    });

    builder.waitFor(combined.name, api.name);

    return [api, combined];
  }

  /** Declare environment values used by workers Aspire resources. */
  override declareEnv(_ctx: ContributionContext): Record<string, EnvSource | string> {
    return {
      WORKERS_API_URL: { kind: 'resource', resource: WORKERS_API_RESOURCE, key: 'url' },
      WORKER_CONCURRENCY: '2',
    };
  }

  /** Declare health checks used by plugin doctor commands. */
  override declareHealthChecks(ctx: ContributionContext): readonly HealthCheckSpec[] {
    const apiPort = ctx.port(WORKERS_API_RESOURCE);
    return [{
      resource: WORKERS_API_RESOURCE,
      url: `http://localhost:${apiPort}/health`,
      expect: 200,
      timeoutMs: 3000,
    }];
  }
}
