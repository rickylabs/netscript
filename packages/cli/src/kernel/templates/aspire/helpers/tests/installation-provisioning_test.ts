/** Focused execution of the generated credential carrier against the builder port. */
import { assert, assertEquals, assertRejects } from '@std/assert';
import { dirname, join } from '@std/path';
import { os } from 'npm:@orpc/server@^1.15.5';
import { createService } from '@netscript/service';
import {
  createCompositeAuthenticator,
  createContractOverlayAuthorizer,
  createInternalCredentialAuthenticator,
  deriveInternalCredential,
  loadInstallationSecret,
} from '@netscript/service/auth';
import { createInternalCredentialSdkClientContribution } from '@netscript/sdk/client';
import type { NetScriptConfig } from '@netscript/aspire/types';
import type { NetScriptProcedureMeta } from '@netscript/contracts';
import { generateHelpers } from '../helpers-generator-pipeline.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';
import {
  EMPTY_CONFIG,
  MINIMAL_BACKGROUND,
  MINIMAL_SERVICE,
  PLUGIN_WITH_REFS,
} from './generators-test-support.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

class Resource {
  readonly environment: Record<string, string> = {};
  constructor(readonly name: string, readonly args: string[]) {}
  withEnvironment(key: string, value: string): this {
    this.environment[key] = value;
    return this;
  }
  withHttpEndpoint(): this {
    return this;
  }
  withHttpHealthCheck(): this {
    return this;
  }
  withOtlpExporter(): this {
    return this;
  }
  getEndpoint(): Promise<string> {
    return Promise.resolve('http://localhost:1');
  }
}

interface GeneratedAppHost {
  createNetScriptAppHost(builder: object, configPath: string): Promise<void>;
}

async function generatedCarrier(
  use: (resources: Resource[], file: string) => Promise<void>,
): Promise<void> {
  const root = await Deno.makeTempDir();
  const previous = Deno.env.get('NETSCRIPT_INSTALLATION_SECRET_FILE');
  const secretFile = join(root, '.data', 'aspire-secrets', 'installation.secret');
  Deno.env.delete('NETSCRIPT_INSTALLATION_SECRET_FILE');
  try {
    const config: NetScriptConfig = {
      ...EMPTY_CONFIG,
      Services: { orders: { ...MINIMAL_SERVICE, HealthCheckPath: false } },
      Plugins: {
        'workers-api': {
          ...PLUGIN_WITH_REFS,
          ServiceReferences: [],
          PluginReferences: [],
        },
      },
      BackgroundProcessors: Object.fromEntries(
        ['workers', 'sagas', 'triggers'].map((name) => [name, {
          ...MINIMAL_BACKGROUND,
          Entrypoint: `${name}/runtime.ts`,
          Telemetry: false,
        }]),
      ),
      Defaults: {
        Deno: {
          Permissions: ['--allow-read=./config', '--allow-env=PORT'],
          WatchMode: false,
        },
      },
    };
    const files = await generateHelpers({ config });
    for (const file of files) {
      const path = join(root, file.path);
      await Deno.mkdir(dirname(path), { recursive: true });
      await Deno.writeTextFile(path, file.content);
    }
    await Deno.mkdir(join(root, '.aspire/modules'), { recursive: true });
    await Deno.writeTextFile(
      join(root, '.aspire/modules/aspire.mts'),
      "export const OtlpProtocol = { HttpProtobuf: 'http' }; export class ReferenceExpression {}\n",
    );
    // Keep registration helpers real; isolate unrelated dashboard/infrastructure ports.
    await Deno.writeTextFile(
      join(root, '.helpers/_aspire-compat.mts'),
      `
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
export function parseAppSettings(path) { return { config: JSON.parse(readFileSync(path, 'utf8')) }; }
export function resolveWorkspacePath(root, path) { return resolve(root, path); }
export function resolvePermissions(entry, defaults) { return entry ?? defaults; }
export function buildDatabaseUriEnvKey() { return null; }
export function buildDatabaseProviderEnvVars() { return {}; }
export function buildSqliteDatabaseUrl() { throw new Error('unexpected database'); }
export function buildOtelEnvVars() { return {}; }
export function buildViteEnvVarName() { throw new Error("unexpected app"); }
export function withCacheReference() { throw new Error("unexpected cache"); }
export function extractPluginReferences(entry) { return entry.PluginReferences ?? []; }
export function extractServiceReferences(entry) { return entry.ServiceReferences ?? []; }
`,
    );
    await Deno.writeTextFile(
      join(root, '.helpers/configure-dashboard.mts'),
      'export function configureDashboard() {}',
    );
    await Deno.writeTextFile(
      join(root, '.helpers/register-infrastructure.mts'),
      'export async function registerInfrastructure() { return {}; }',
    );
    await Deno.writeTextFile(
      join(root, '.helpers/db-cli-mode.mts'),
      'export async function tryHandleDbCliMode() { return false; }',
    );
    const configPath = join(root, 'config.json');
    await Deno.writeTextFile(configPath, JSON.stringify(config));
    const module: GeneratedAppHost = await import(
      new URL(`file://${join(root, '.helpers/index.mts')}`).href
    );
    const resources: Resource[] = [];
    const parameters: Array<{ name: string; value: string; secret: boolean }> = [];
    const builder = {
      appHostDirectory: () => Promise.resolve(join(root, 'aspire')),
      addParameter: (
        name: string,
        options: { value: string; secret: boolean },
      ) => {
        parameters.push({ name, ...options });
        return Promise.resolve({});
      },
      addExecutable: (
        name: string,
        _executable: string,
        _workdir: string,
        args: string[],
      ) => {
        const resource = new Resource(name, args);
        resources.push(resource);
        return resource;
      },
    };
    await module.createNetScriptAppHost(builder, configPath);
    assertEquals(
      resources.map((resource) => resource.environment.NETSCRIPT_INSTALLATION_SECRET_FILE),
      Array(5).fill(secretFile),
      'generated backend resources must receive the provisioned installation credential file reference',
    );
    assertEquals(parameters.length, 1);
    assertEquals(parameters[0], {
      name: 'netscript-installation-secret',
      value: await Deno.readTextFile(secretFile),
      secret: true,
    });
    assertEquals(resources.map((resource) => resource.name).sort(), [
      'orders',
      'sagas',
      'triggers',
      'workers',
      'workers-api',
    ]);
    for (const resource of resources) {
      assertEquals(
        resource.environment.NETSCRIPT_INSTALLATION_SECRET_FILE,
        secretFile,
      );
      assert(resource.args.includes(`--allow-read=./config,${secretFile}`));
      assert(
        resource.args.includes(
          '--allow-env=PORT,NETSCRIPT_INSTALLATION_SECRET_FILE',
        ),
      );
      assert(!JSON.stringify(resource).includes(parameters[0].value));
    }
    // Model the backend's delivered environment only after the AppHost provisions it.
    Deno.env.set('NETSCRIPT_INSTALLATION_SECRET_FILE', secretFile);
    await use(resources, secretFile);
  } finally {
    if (previous === undefined) {
      Deno.env.delete('NETSCRIPT_INSTALLATION_SECRET_FILE');
    } else Deno.env.set('NETSCRIPT_INSTALLATION_SECRET_FILE', previous);
    await Deno.remove(root, { recursive: true });
  }
}

Deno.test('generated installation carrier gives services and all background processors only the file reference', () =>
  generatedCarrier(async (_resources, file) => {
    const secret = await loadInstallationSecret({ path: file });
    assertEquals(secret.kind, 'netscript.installation-secret');
  }));

Deno.test('provisioned internal calls reject anonymous, wrong, user-session and rotated credentials on both projections', () =>
  generatedCarrier(async (resources, file) => {
    const secret = await loadInstallationSecret({
      path: resources[0].environment.NETSCRIPT_INSTALLATION_SECRET_FILE,
    });
    const procedure = os.$meta<NetScriptProcedureMeta>({});
    const router = {
      internal: {
        sync: procedure.route({ method: 'POST', path: '/internal/sync' }).meta({
          access: { audience: 'internal' },
        }).handler(() => ({ synced: true })),
      },
      public: {
        ping: procedure.route({ method: 'POST', path: '/ping' }).handler(
          () => ({ pong: true }),
        ),
      },
    };
    const makeApp = (
      material: Awaited<ReturnType<typeof loadInstallationSecret>>,
    ) =>
      createService(router, { name: 'orders' })
        .withRPC({ rpcPath: '/api/rpc' })
        .withAuthn({
          allowAnonymous: ['/api', '/health'],
          authenticator: createCompositeAuthenticator([
            createInternalCredentialAuthenticator({
              secret: material,
              service: 'orders',
            }),
            {
              authenticate: (request) =>
                Promise.resolve(
                  request.header('authorization') === 'Bearer user-session'
                    ? {
                      ok: true as const,
                      principal: {
                        subject: 'user:owner',
                        scheme: 'bearer',
                        claims: {},
                        roles: ['service'],
                        scopes: ['*'],
                      },
                    }
                    : {
                      ok: false as const,
                      reason: 'invalid-credential' as const,
                    },
                ),
            },
          ]),
        })
        .withAuthz({ authorizer: createContractOverlayAuthorizer(router) })
        .build();
    const app = makeApp(secret);
    const contribution = createInternalCredentialSdkClientContribution({
      service: 'orders',
    });
    const prepared = await contribution.prepare({
      context: {},
      procedure: {
        path: ['internal', 'sync'],
        meta: { access: { audience: 'internal' } },
      },
      transport: {
        kind: 'http',
        origin: new URL('http://localhost:1'),
        rpcPath: '/api/rpc',
        secure: false,
      },
      input: {},
    });
    const authorization = prepared.headers?.authorization;
    assert(authorization);
    for (const path of ['/api/rpc/internal/sync', '/api/internal/sync']) {
      const invoke = (token?: string, service = app) =>
        service.fetch(
          new Request(`http://localhost${path}`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              ...(token ? { authorization: token } : {}),
            },
            body: path.includes('/rpc/') ? '{"json":{}}' : '{}',
          }),
        );
      for (const token of [undefined, 'Bearer wrong', 'Bearer user-session']) {
        assert([401, 403].includes((await invoke(token)).status));
      }
      assertEquals((await invoke(authorization)).status, 200);
      assertEquals(
        (await invoke(
          `Bearer ${await deriveInternalCredential(secret, 'other-service')}`,
        )).status,
        401,
      );
      await Deno.writeTextFile(
        file,
        'rotated-installation-material-'.repeat(3),
      );
      const rotated = makeApp(await loadInstallationSecret({ path: file }));
      assertEquals((await invoke(authorization, rotated)).status, 401);
      assertEquals(
        (await invoke(
          `Bearer ${await deriveInternalCredential(
            await loadInstallationSecret({ path: file }),
            'orders',
          )}`,
          rotated,
        )).status,
        200,
      );
    }
    for (const path of ['/api/rpc/public/ping', '/api/ping']) {
      assertEquals(
        (await app.fetch(
          new Request(`http://localhost${path}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: path.includes('/rpc/') ? '{"json":{}}' : '{}',
          }),
        )).status,
        200,
      );
    }
    await Deno.remove(file);
    await assertRejects(() => loadInstallationSecret({ path: file }));
  }));
