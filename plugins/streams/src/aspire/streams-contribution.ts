import {
  type AspireBuilder,
  AspireNSPluginContribution,
  type AspireResource,
  type ContributionContext,
  type EnvSource,
  type HealthCheckSpec,
} from '@netscript/aspire/public';

/** Aspire contribution for the Durable Streams development service. */
export class StreamsAspireContribution extends AspireNSPluginContribution {
  /** Plugin package name owning this contribution. */
  readonly pluginName = '@netscript/plugin-streams';

  /** Register the streams Deno service resource with the AppHost builder. */
  contribute(
    builder: AspireBuilder,
    ctx: ContributionContext,
  ): readonly AspireResource[] {
    const servicePort = ctx.port('streams');
    const service = builder.addDenoService('streams', {
      workdir: ctx.projectRoot,
      entrypoint: 'plugins/streams/services/src/main.ts',
      port: servicePort,
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
      DURABLE_STREAMS_URL: { kind: 'resource', resource: 'streams', key: 'url' },
    };
  }

  /** Declare health checks used by plugin doctor commands. */
  override declareHealthChecks(ctx: ContributionContext): readonly HealthCheckSpec[] {
    const servicePort = ctx.port('streams');
    return [{
      resource: 'streams',
      url: `http://localhost:${servicePort}/health`,
      expect: 200,
      timeoutMs: 3000,
    }];
  }
}
