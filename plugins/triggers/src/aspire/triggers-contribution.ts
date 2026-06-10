import {
  TRIGGERS_API_DEFAULT_PORT,
  TRIGGERS_API_SERVICE_NAME,
  TRIGGERS_PLUGIN_VERSION,
} from '../constants.ts';

/** Package name reported by the triggers Aspire contribution. */
export const TRIGGERS_PLUGIN_PACKAGE_NAME = '@netscript/plugin-triggers' as const;
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

/** Environment source reference accepted by triggers Aspire declarations. */
export type TriggersEnvSource =
  | { readonly kind: 'literal'; readonly value: string }
  | { readonly kind: 'resource'; readonly resource: string; readonly key: string }
  | { readonly kind: 'secret'; readonly name: string };

/** Resource returned by the triggers Aspire builder boundary. */
export interface TriggersAspireResource {
  /** Stable resource name. */
  readonly name: string;
  /** Resource kind supplied by the host builder. */
  readonly kind?: string;
  /** Host-specific resource metadata. */
  readonly [key: string]: unknown;
}

/** Deno service resource spec used by the triggers Aspire contribution. */
export interface TriggersDenoServiceSpec {
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

/** Deno background resource spec used by the triggers Aspire contribution. */
export interface TriggersDenoBackgroundSpec {
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

/** Aspire builder methods required by the triggers contribution. */
export interface TriggersAspireBuilder {
  /** Add a Deno HTTP service resource. */
  addDenoService(name: string, spec: TriggersDenoServiceSpec): TriggersAspireResource;
  /** Add a Deno background process resource. */
  addDenoBackground(name: string, spec: TriggersDenoBackgroundSpec): TriggersAspireResource;
  /** Record a blocking startup dependency from one resource to another. */
  waitFor(from: string, to: string): void;
}

/** Contribution context required by the triggers Aspire contribution. */
export interface TriggersContributionContext {
  /** Root directory of the NetScript project. */
  readonly projectRoot: string;
  /** Deterministic port allocator. */
  readonly port: (key: string, fallback?: number) => number;
}

/** Health check declaration emitted by the triggers Aspire contribution. */
export interface TriggersHealthCheckSpec {
  /** Resource name checked by the health probe. */
  readonly resource: string;
  /** URL to probe. */
  readonly url: string;
  /** Expected HTTP status code. */
  readonly expect: number;
  /** Optional timeout in milliseconds. */
  readonly timeoutMs?: number;
}

/** Aspire contribution for the NetScript triggers plugin. */
export class TriggersAspireContribution {
  /** Plugin package name owning this contribution. */
  readonly pluginName: string = TRIGGERS_PLUGIN_PACKAGE_NAME;

  /** Register triggers API and background processor resources with the AppHost builder. */
  contribute(
    builder: TriggersAspireBuilder,
    ctx: TriggersContributionContext,
  ): readonly TriggersAspireResource[] {
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
  declareEnv(_ctx: TriggersContributionContext): Record<string, TriggersEnvSource | string> {
    return {
      TRIGGERS_API_URL: `http://localhost:${TRIGGERS_API_DEFAULT_PORT}`,
      TRIGGERS_ADAPTER: 'native',
      TRIGGERS_DURABILITY_TIER: 't1',
      [TRIGGERS_PROCESSOR_CONCURRENCY_ENV]: TRIGGERS_DEFAULT_PROCESSOR_CONCURRENCY,
    };
  }

  /** Declare health checks used by plugin doctor commands. */
  declareHealthChecks(_ctx: TriggersContributionContext): readonly TriggersHealthCheckSpec[] {
    return [{
      resource: TRIGGERS_API_SERVICE_NAME,
      url: `http://localhost:${TRIGGERS_API_DEFAULT_PORT}/health`,
      expect: 200,
      timeoutMs: 3000,
    }];
  }
}
