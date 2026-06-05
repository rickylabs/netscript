import {
  type AspireBuilder,
  AspireNSPluginContribution,
  type AspireResource,
  type ContributionContext,
  type EnvSource,
  type HealthCheckSpec,
} from '@netscript/aspire';

import {
  TRIGGERS_API_DEFAULT_PORT,
  TRIGGERS_API_SERVICE_NAME,
  TRIGGERS_PLUGIN_VERSION,
} from '../constants.ts';

const TRIGGERS_PLUGIN_PACKAGE_NAME = '@netscript/plugin-triggers' as const;
const TRIGGERS_PROCESSOR_RESOURCE_NAME = 'trigger-processor' as const;
const TRIGGERS_PROCESSOR_CONCURRENCY_ENV = 'TRIGGERS_PROCESSOR_CONCURRENCY' as const;
const TRIGGERS_DEFAULT_PROCESSOR_CONCURRENCY = '2' as const;

const TRIGGERS_API_PERMISSIONS = [
  '--unstable-kv',
  '--allow-net',
  '--allow-env',
  '--allow-read',
  '--allow-write',
] as const;

const TRIGGERS_PROCESSOR_PERMISSIONS = [
  '--unstable-kv',
  '--allow-net',
  '--allow-env',
  '--allow-read',
  '--allow-write',
] as const;

/** Aspire contribution for the NetScript triggers plugin. */
export class TriggersAspireContribution extends AspireNSPluginContribution {
  /** Plugin package name owning this contribution. */
  readonly pluginName: typeof TRIGGERS_PLUGIN_PACKAGE_NAME = TRIGGERS_PLUGIN_PACKAGE_NAME;

  /** Register triggers API and background processor resources with the AppHost builder. */
  contribute(
    builder: AspireBuilder,
    ctx: ContributionContext,
  ): readonly AspireResource[] {
    const api = builder.addDenoService(TRIGGERS_API_SERVICE_NAME, {
      workdir: ctx.projectRoot,
      entrypoint: 'plugins/triggers/services/src/main.ts',
      port: ctx.port(TRIGGERS_API_SERVICE_NAME, TRIGGERS_API_DEFAULT_PORT),
      permissions: TRIGGERS_API_PERMISSIONS,
      env: {
        TRIGGERS_PLUGIN_VERSION,
      },
    });

    const processor = builder.addDenoBackground(TRIGGERS_PROCESSOR_RESOURCE_NAME, {
      workdir: ctx.projectRoot,
      entrypoint: 'plugins/triggers/src/runtime/trigger-processor.ts',
      permissions: TRIGGERS_PROCESSOR_PERMISSIONS,
      concurrencyEnvVar: TRIGGERS_PROCESSOR_CONCURRENCY_ENV,
      watchMode: true,
    });

    builder.waitFor(processor.name, api.name);

    return [api, processor];
  }

  /** Declare environment values used by triggers Aspire resources. */
  override declareEnv(_ctx: ContributionContext): Record<string, EnvSource | string> {
    return {
      TRIGGERS_API_URL: `http://localhost:${TRIGGERS_API_DEFAULT_PORT}`,
      TRIGGERS_ADAPTER: 'native',
      TRIGGERS_DURABILITY_TIER: 't1',
      [TRIGGERS_PROCESSOR_CONCURRENCY_ENV]: TRIGGERS_DEFAULT_PROCESSOR_CONCURRENCY,
    };
  }

  /** Declare health checks used by plugin doctor commands. */
  override declareHealthChecks(_ctx: ContributionContext): readonly HealthCheckSpec[] {
    return [{
      resource: TRIGGERS_API_SERVICE_NAME,
      url: `http://localhost:${TRIGGERS_API_DEFAULT_PORT}/health`,
      expect: 200,
      timeoutMs: 3000,
    }];
  }
}
