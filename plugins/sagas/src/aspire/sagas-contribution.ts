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

/** Environment source reference accepted by sagas Aspire declarations. */
export type SagasEnvSource =
  | { readonly kind: 'literal'; readonly value: string }
  | { readonly kind: 'resource'; readonly resource: string; readonly key: string }
  | { readonly kind: 'secret'; readonly name: string };

/** Resource returned by the sagas Aspire builder boundary. */
export interface SagasAspireResource {
  /** Stable resource name. */
  readonly name: string;
  /** Resource kind supplied by the host builder. */
  readonly kind?: string;
  /** Host-specific resource metadata. */
  readonly [key: string]: unknown;
}

/** Deno service resource spec used by the sagas Aspire contribution. */
export interface SagasDenoServiceSpec {
  /** Working directory for the resource process. */
  readonly workdir: string;
  /** Entrypoint executed by Deno. */
  readonly entrypoint: string;
  /** HTTP port assigned to the resource. */
  readonly port?: number;
  /** Deno permissions granted to the process. */
  readonly permissions?: readonly string[];
  /** Environment variables attached to the resource. */
  readonly env?: Readonly<Record<string, string>>;
}

/** Deno background resource spec used by the sagas Aspire contribution. */
export interface SagasDenoBackgroundSpec {
  /** Working directory for the resource process. */
  readonly workdir: string;
  /** Entrypoint executed by Deno. */
  readonly entrypoint: string;
  /** Deno permissions granted to the process. */
  readonly permissions?: readonly string[];
  /** Optional environment variable used by the host to control concurrency. */
  readonly concurrencyEnvVar?: string;
  /** Whether the background process should run in watch mode. */
  readonly watchMode?: boolean;
}

/** Aspire builder methods required by the sagas contribution. */
export interface SagasAspireBuilder {
  /** Add a Deno HTTP service resource. */
  addDenoService(name: string, spec: SagasDenoServiceSpec): SagasAspireResource;
  /** Add a Deno background process resource. */
  addDenoBackground(name: string, spec: SagasDenoBackgroundSpec): SagasAspireResource;
}

/** Contribution context required by the sagas Aspire contribution. */
export interface SagasContributionContext {
  /** Root directory of the NetScript project. */
  readonly projectRoot: string;
  /** Deterministic port allocator. */
  readonly port: (key: string, fallback?: number) => number;
}

/** Health check declaration emitted by the sagas Aspire contribution. */
export interface SagasHealthCheckSpec {
  /** Resource name checked by the health probe. */
  readonly resource: string;
  /** URL to probe. */
  readonly url: string;
  /** Expected HTTP status code. */
  readonly expect: number;
  /** Optional timeout in milliseconds. */
  readonly timeoutMs?: number;
}

/** Aspire contribution for the NetScript sagas plugin. */
export class SagasAspireContribution {
  /** Plugin package name owning this contribution. */
  readonly pluginName: string = SAGAS_PLUGIN_PACKAGE_NAME;

  /** Register sagas API and background runtime resources with the AppHost builder. */
  contribute(
    builder: SagasAspireBuilder,
    ctx: SagasContributionContext,
  ): readonly SagasAspireResource[] {
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
  declareEnv(_ctx: SagasContributionContext): Record<string, SagasEnvSource | string> {
    return {
      SAGAS_API_URL: `http://localhost:${SAGAS_API_DEFAULT_PORT}`,
      SAGAS_ADAPTER: 'native',
      SAGAS_DURABILITY_TIER: 't1',
      [SAGAS_RUNNER_CONCURRENCY_ENV]: SAGAS_DEFAULT_RUNNER_CONCURRENCY,
    };
  }

  /** Declare health checks used by plugin doctor commands. */
  declareHealthChecks(_ctx: SagasContributionContext): readonly SagasHealthCheckSpec[] {
    return [{
      resource: SAGAS_API_SERVICE_NAME,
      url: `http://localhost:${SAGAS_API_DEFAULT_PORT}/health`,
      expect: 200,
      timeoutMs: 3000,
    }];
  }
}
