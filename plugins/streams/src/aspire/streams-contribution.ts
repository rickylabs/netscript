import {
  type AspireBuilder,
  AspireNSPluginContribution,
  type AspireResource,
  type ContributionContext,
  type EnvSource,
} from '@netscript/aspire/public';

/** Environment binding for the explicit file-storage opt-in. */
const STREAMS_DATA_DIR = 'STREAMS_DATA_DIR';

/** Aspire contribution for the ephemeral-by-default Durable Streams protocol service. */
export class StreamsAspireContribution extends AspireNSPluginContribution {
  /** Plugin package name owning this contribution. */
  readonly pluginName = '@netscript/plugin-streams';

  /** Select a host-provisioned directory; omission preserves ephemeral storage. */
  constructor(private readonly options: { readonly dataDir?: string } = {}) {
    super();
    if (options.dataDir !== undefined && options.dataDir.trim().length === 0) {
      throw new Error('Streams dataDir must not be blank.');
    }
  }

  /** Register streams and declare opt-in directory provisioning to the AppHost builder. */
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
        ...(this.options.dataDir === undefined ? {} : { [STREAMS_DATA_DIR]: this.options.dataDir }),
      },
      ...(this.options.dataDir === undefined ? {} : {
        dataDirectories: { [STREAMS_DATA_DIR]: this.options.dataDir },
      }),
    });

    return [service];
  }

  /** Declare environment values used by the streams Aspire resource. */
  override declareEnv(_ctx: ContributionContext): Record<string, EnvSource | string> {
    return {
      DURABLE_STREAMS_URL: { kind: 'resource', resource: 'streams', key: 'url' },
    };
  }
}
