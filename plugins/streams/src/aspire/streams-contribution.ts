import {
  AspireNSPluginContribution,
  type AspireBuilder,
  type AspireResource,
  type ContributionContext,
  type EnvSource,
  type HealthCheckSpec,
} from '@netscript/aspire';

/** Aspire contribution for the Durable Streams development service. */
export class StreamsAspireContribution extends AspireNSPluginContribution {
  /** Plugin package name owning this contribution. */
  readonly pluginName = '@netscript/plugin-streams';

  /** Register the streams Deno service resource with the AppHost builder. */
  contribute(
    builder: AspireBuilder,
    ctx: ContributionContext,
  ): readonly AspireResource[] {
    const service = builder.addDenoService('streams', {
      workdir: ctx.projectRoot,
      entrypoint: 'plugins/streams/services/src/main.ts',
      port: ctx.port('streams', 4437),
      permissions: [
        '--allow-net',
        '--allow-env',
        '--allow-read',
        '--allow-write',
        '--allow-sys',
        '--allow-ffi',
      ],
      env: {
        STREAMS_PLUGIN_VERSION: '0.0.1-alpha.0',
      },
    });

    return [service];
  }

  /** Declare environment values used by the streams Aspire resource. */
  override declareEnv(_ctx: ContributionContext): Record<string, EnvSource | string> {
    return {
      DURABLE_STREAMS_URL: 'http://localhost:4437',
    };
  }

  /** Declare health checks used by plugin doctor commands. */
  override declareHealthChecks(_ctx: ContributionContext): readonly HealthCheckSpec[] {
    return [{
      resource: 'streams',
      url: 'http://localhost:4437/health',
      expect: 200,
      timeoutMs: 3000,
    }];
  }
}
