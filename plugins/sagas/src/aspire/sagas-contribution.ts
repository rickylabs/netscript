import {
  type AspireBuilder,
  AspireNSPluginContribution,
  type AspireResource,
  type ContributionContext,
  type EnvSource,
  type HealthCheckSpec,
} from '@netscript/aspire';

import {
  SAGAS_API_DEFAULT_PORT,
  SAGAS_API_SERVICE_NAME,
  SAGAS_PLUGIN_VERSION,
} from '../constants.ts';

const SAGAS_PLUGIN_PACKAGE_NAME = '@netscript/plugin-sagas' as const;
const SAGAS_BACKGROUND_RESOURCE_NAME = 'sagas-runner' as const;
const SAGAS_RUNNER_CONCURRENCY_ENV = 'SAGAS_RUNNER_CONCURRENCY' as const;
const SAGAS_DEFAULT_RUNNER_CONCURRENCY = '2' as const;

const SAGAS_API_PERMISSIONS = [
  '--unstable-kv',
  '--allow-net',
  '--allow-env',
  '--allow-read',
  '--allow-write',
] as const;

const SAGAS_BACKGROUND_PERMISSIONS = [
  '--unstable-kv',
  '--allow-net',
  '--allow-env',
  '--allow-read',
  '--allow-write',
] as const;

/** Aspire contribution for the NetScript sagas plugin. */
export class SagasAspireContribution extends AspireNSPluginContribution {
  /** Plugin package name owning this contribution. */
  readonly pluginName: typeof SAGAS_PLUGIN_PACKAGE_NAME = SAGAS_PLUGIN_PACKAGE_NAME;

  /** Register sagas API and background runtime resources with the AppHost builder. */
  contribute(
    builder: AspireBuilder,
    ctx: ContributionContext,
  ): readonly AspireResource[] {
    const api = builder.addDenoService(SAGAS_API_SERVICE_NAME, {
      workdir: ctx.projectRoot,
      entrypoint: 'plugins/sagas/services/src/main.ts',
      port: ctx.port(SAGAS_API_SERVICE_NAME, SAGAS_API_DEFAULT_PORT),
      permissions: SAGAS_API_PERMISSIONS,
      env: {
        SAGAS_PLUGIN_VERSION,
      },
    });

    const runner = builder.addDenoBackground(SAGAS_BACKGROUND_RESOURCE_NAME, {
      workdir: ctx.projectRoot,
      entrypoint: 'plugins/sagas/src/runtime/saga-runner.ts',
      permissions: SAGAS_BACKGROUND_PERMISSIONS,
      concurrencyEnvVar: SAGAS_RUNNER_CONCURRENCY_ENV,
      watchMode: true,
    });

    return [api, runner];
  }

  /** Declare environment values used by sagas Aspire resources. */
  override declareEnv(_ctx: ContributionContext): Record<string, EnvSource | string> {
    return {
      SAGAS_API_URL: `http://localhost:${SAGAS_API_DEFAULT_PORT}`,
      SAGAS_ADAPTER: 'native',
      SAGAS_DURABILITY_TIER: 't1',
      [SAGAS_RUNNER_CONCURRENCY_ENV]: SAGAS_DEFAULT_RUNNER_CONCURRENCY,
    };
  }

  /** Declare health checks used by plugin doctor commands. */
  override declareHealthChecks(_ctx: ContributionContext): readonly HealthCheckSpec[] {
    return [{
      resource: SAGAS_API_SERVICE_NAME,
      url: `http://localhost:${SAGAS_API_DEFAULT_PORT}/health`,
      expect: 200,
      timeoutMs: 3000,
    }];
  }
}
