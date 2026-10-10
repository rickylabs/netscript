/** Test boundary for executed app registration; no Aspire process is started. */
import { assert, assertEquals } from '@std/assert';
import { toFileUrl } from '@std/path';
import type { NetScriptConfig } from '@netscript/aspire/types';
import { generateRegisterApps } from '../register/generate-register-apps.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';
import { TEMPLATE_KEYS } from '../../../../assets/manifest.ts';

DEFAULT_TEMPLATE_REGISTRY.register(TEMPLATE_KEYS.generatedAspireHelpersGenerateRegisterApps1, {
  path: TEMPLATE_KEYS.generatedAspireHelpersGenerateRegisterApps1,
  content: await Deno.readTextFile(
    new URL(
      '../../../../assets/generated/aspire/helpers/generate-register-apps-1.ts.template',
      import.meta.url,
    ),
  ),
});
await DEFAULT_TEMPLATE_REGISTRY.hydrate();

// Relevant pinned SDK contract: getEndpoint returns an opaque reference; refExpr
// preserves references (including nested expressions) until AppHost allocation.
const SDK_DOUBLE = `
export interface EndpointReference { readonly resourceName: string }
export interface ReferenceExpression { readonly strings: readonly string[]; readonly values: readonly unknown[] }
export function refExpr(strings: TemplateStringsArray, ...values: unknown[]): ReferenceExpression {
  return { strings: [...strings], values };
}
export const OtlpProtocol = { HttpProtobuf: 1 };
export interface Resource {
  withEnvironment(key: string, value: unknown): Resource;
  withHttpEndpoint(options: unknown): Resource;
  withHttpHealthCheck(options: unknown): Resource;
  withBrowserLogs(): Resource;
  withOtlpExporter(options: unknown): Resource;
  waitForCompletion(resource: Resource): Resource;
  getEndpoint(name: string): Promise<EndpointReference>;
}
export interface DistributedApplicationBuilder {
  addExecutable(name: string, command: string, workdir: string, args: readonly string[]): Resource;
}
`;

const COMPAT_DOUBLE = `
export interface NetScriptConfig { Apps: Record<string, { Enabled?: boolean }>; Version: string }
export function buildOtelEnvVars(_name: string, _version: string, _mode: string): Record<string, string> { return {}; }
export function buildViteEnvVarName(name: string) { return { full: name, shorthand: name }; }
export function resolveWorkspacePath(root: string, path: string) { return root + '/' + path; }
export function withCacheReference(_resource: unknown, _cache: unknown) {}
`;

export class RecordingResource {
  readonly environment: { key: string; value: unknown }[] = [];
  constructor(readonly name: string) {}
  withEnvironment(key: string, value: unknown): this {
    this.environment.push({ key, value });
    return this;
  }
  withHttpEndpoint(): this {
    return this;
  }
  withHttpHealthCheck(): this {
    return this;
  }
  withBrowserLogs(): this {
    return this;
  }
  withOtlpExporter(): this {
    return this;
  }
  waitForCompletion(): this {
    return this;
  }
  getEndpoint(): Promise<{ resourceName: string }> {
    return Promise.resolve({ resourceName: this.name });
  }
}

interface GeneratedModule {
  registerApps(
    builder: { addExecutable(name: string): RecordingResource },
    config: NetScriptConfig,
    infrastructure: object,
    services: Map<string, RecordingResource>,
    plugins: Map<string, RecordingResource>,
    root: string,
  ): Promise<Map<string, unknown>>;
}

function isGeneratedModule(value: unknown): value is GeneratedModule {
  return value !== null && typeof value === 'object' &&
    'registerApps' in value && typeof value.registerApps === 'function';
}

/** Executes emitted code with recording resources and checks its SDK-facing types. */
export async function registerWorkspace(config: NetScriptConfig) {
  const root = await Deno.makeTempDir({ prefix: 'netscript-cors-' });
  const services = new Map(
    Object.keys(config.Services).map((name) => [name, new RecordingResource(name)]),
  );
  const plugins = new Map(
    Object.keys(config.Plugins).map((name) => [name, new RecordingResource(name)]),
  );
  const apps = new Map<string, RecordingResource>();
  // Existing declarations are overridden by the workspace origin policy.
  for (const target of [...services.values(), ...plugins.values()]) {
    target.withEnvironment('NETSCRIPT_CORS_ORIGINS', 'https://stale.example');
  }
  try {
    await Deno.mkdir(`${root}/.helpers`);
    await Deno.mkdir(`${root}/.aspire/modules`, { recursive: true });
    await Deno.writeTextFile(`${root}/.aspire/modules/aspire.mts`, SDK_DOUBLE);
    await Deno.writeTextFile(`${root}/.helpers/_aspire-compat.mts`, COMPAT_DOUBLE);
    await Deno.writeTextFile(
      `${root}/.helpers/register-infrastructure.mts`,
      'export interface InfrastructureContext { primaryCacheWiring?: unknown }',
    );
    const path = `${root}/.helpers/register-apps.mts`;
    await Deno.writeTextFile(
      path,
      generateRegisterApps({
        apps: config.Apps,
        version: config.Version,
        denoDefaults: config.Defaults.Deno,
      }),
    );
    const checked = await new Deno.Command(Deno.execPath(), {
      args: ['check', '--no-config', '--no-lock', '--unstable-kv', path],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(checked.code, 0, new TextDecoder().decode(checked.stderr));
    const module: unknown = await import(toFileUrl(path).href);
    assert(isGeneratedModule(module));
    await module.registerApps(
      {
        addExecutable(name) {
          const app = new RecordingResource(name);
          apps.set(name, app);
          return app;
        },
      },
      config,
      {},
      services,
      plugins,
      root,
    );
    return { services, plugins, apps };
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

/** Resolves the recorded expression only AFTER registration, like AppHost allocation. */
export function allocatedValue(value: unknown, origins: ReadonlyMap<string, string>): string {
  if (typeof value === 'string') return value;
  assert(value !== null && typeof value === 'object');
  if ('resourceName' in value) {
    assert(typeof value.resourceName === 'string');
    const origin = origins.get(value.resourceName);
    assert(origin, `Unallocated endpoint: ${value.resourceName}`);
    return origin;
  }
  assert('strings' in value && Array.isArray(value.strings));
  assert('values' in value && Array.isArray(value.values));
  let result = '';
  for (let i = 0; i < value.strings.length; i++) {
    result += value.strings[i];
    if (i < value.values.length) result += allocatedValue(value.values[i], origins);
  }
  return result;
}

export function corsValue(resource: RecordingResource): unknown {
  return resource.environment.filter((call) => call.key === 'NETSCRIPT_CORS_ORIGINS').at(-1)?.value;
}
