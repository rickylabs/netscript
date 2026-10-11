import { MemoryKvAdapter } from '@netscript/kv';
import {
  createKvOAuthTestRegistry,
  mintTestSession,
  serveAuthTestService,
} from '../../../../../../../plugins/auth/tests/testing/auth-service-fixture.ts';
import { writeInstalledAuthFixture } from '../../../../../tests/installed-auth-fixture.ts';
import { readAuthServiceName } from '../../../../../src/kernel/adapters/service/auth-policy.ts';
import { assertEquals, assertStringIncludes } from '@std/assert';
import { dirname, join, relative, resolve, toFileUrl } from '@std/path';
import { SCAFFOLD_APP_IMPORTS } from '../../../../../src/kernel/constants/scaffold/scaffold-app-catalog.ts';
import type { RunningService } from '@netscript/service';
import { DenoFileSystem } from '../../../../../src/kernel/adapters/runtime/file-system/deno-file-system.ts';
import { DenoProcess } from '../../../../../src/kernel/adapters/runtime/process/deno-process.ts';
import { DenoGeneratedSourceFormatter } from '../../../../../src/kernel/adapters/runtime/process/deno-generated-source-formatter.ts';
import { reconcileBrowserAuth } from '../../../../../src/kernel/adapters/plugin/browser-auth-reconciler.ts';
import { renderTemplateAssetSync } from '../../../../../src/kernel/adapters/templates/template-asset.ts';
import { TEMPLATE_KEYS } from '../../../../../src/kernel/assets/manifest.ts';

import { ServiceScaffolder } from '../../../../../src/kernel/adapters/service/scaffolder.ts';
import { Scaffolder } from '../../../../../src/kernel/adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../../../../src/kernel/adapters/scaffold/template-adapter.ts';

// Scaffold and reconcile the actual layered service. Only the database is a fixture:
// the bootstrap, application, repository adapter, contract bindings and policy are generated code.
for (const database of [true, false]) {
  for (const authFirst of [true, false]) {
    Deno.test(`spliced generated ${database ? 'CRUD' : 'memory'} service proves app and REST/RPC guards (${authFirst ? 'auth first' : 'service first'})`, async () => {
      await Deno.mkdir('.llm/tmp', { recursive: true });
      const root = await Deno.makeTempDir({ dir: '.llm/tmp', prefix: 'generated-auth-policy-' });
      await using kv = new MemoryKvAdapter();
      const registry = await createKvOAuthTestRegistry(kv);
      await using auth = await serveAuthTestService(registry);
      const token = await mintTestSession(registry);
      const savedEnv = new Map(['PORT', 'services__auth__http__0', 'services__users__http__0']
        .map((key) => [key, Deno.env.get(key)]));
      Deno.env.set('services__auth__http__0', auth.baseUrl);
      const fs = new DenoFileSystem();
      const formatter = new DenoGeneratedSourceFormatter(new DenoProcess());
      let service: RunningService | undefined;
      Deno.env.set('PORT', '0');
      const write = async (path: string, content: string) => {
        await fs.createDir(join(root, path, '..'));
        await fs.writeFile(
          join(root, path),
          content
            .replaceAll("'@orpc/server'", JSON.stringify(SCAFFOLD_APP_IMPORTS['@orpc/server']))
            .replaceAll("'@orpc/contract'", JSON.stringify(SCAFFOLD_APP_IMPORTS['@orpc/contract']))
            .replaceAll("'fresh'", JSON.stringify(SCAFFOLD_APP_IMPORTS.fresh))
            .replaceAll("'zod'", JSON.stringify(SCAFFOLD_APP_IMPORTS.zod)),
        );
      };
      try {
        await write(
          'appsettings.json',
          JSON.stringify({
            NetScript: {
              Plugins: {},
              Apps: { web: { Type: 'app', Workdir: 'apps/web' } },
              Services: { users: { Workdir: 'services/users', Entrypoint: 'src/main.ts' } },
            },
          }),
        );
        await write(
          'apps/web/utils.ts',
          `import { createDefine } from 'fresh';
export const define = createDefine();`,
        );
        if (authFirst) await writeInstalledAuthFixture(fs, resolve(root));
        const prefix = 'services/users/src/';
        const templates = new StringTemplateAdapter(fs);
        const scaffold = await new ServiceScaffolder(
          new Scaffolder(templates, fs),
          fs,
          templates,
          formatter,
        ).scaffold({
          targetPath: root,
          projectName: 'shop',
          serviceName: 'users',
          modelName: 'User',
          servicePort: 0,
          hasDatabase: database,
          importMode: 'local',
          force: true,
        });
        // Inherit the repository's imports; fixture aliases are rewritten below.
        await Deno.remove(join(scaffold.serviceDir, 'deno.json'));
        await write(
          `${prefix}database.ts`,
          `const user = { id: 1, name: 'Demo' };
const client = { user: {
  findMany: (_query: { skip: number; take: number; orderBy: Record<string, string> }) => Promise.resolve([user]),
  count: () => Promise.resolve(1),
  findUnique: (_query: { where: { id: number } }) => Promise.resolve(user),
  create: (_query: { data: { name: string } }) => Promise.resolve(user),
  update: (_query: { where: { id: number }; data: { name?: string } }) => Promise.resolve(user),
  delete: (_query: { where: { id: number } }) => Promise.resolve(user),
} };
export type PrismaClient = typeof client;
export const db = { getClient: () => Promise.resolve(client) };`,
        );
        await write(
          `${prefix}schemas.ts`,
          `import { z } from 'zod';
export const UserSchema = z.object({ id: z.number(), name: z.string() });
export const UserCreateInput = z.object({ name: z.string() });
export const UserUpdateInput = UserCreateInput.partial();`,
        );
        await write(
          'contracts/versions/v1/users.contract.ts',
          renderTemplateAssetSync(
            database ? TEMPLATE_KEYS.serviceContract : TEMPLATE_KEYS.serviceContractMemory,
            { serviceName: 'users', projectName: 'shop', modelName: 'User' },
          ).replace("'@database/zod'", "'../../../services/users/src/schemas.ts'"),
        );
        await write(
          `${prefix}contract.ts`,
          "export * from '../../../contracts/versions/v1/users.contract.ts';",
        );
        await write(
          `${prefix}contract-surface.ts`,
          `import { UsersV1 } from './contract.ts';
export const v1 = { users: UsersV1 };
export type * from './contract.ts';`,
        );
        for (
          const path of scaffold.scaffoldResult.filesCreated.filter((path) => path.endsWith('.ts'))
        ) {
          const local = (name: string) => {
            const specifier = relative(dirname(path), join(root, prefix, name)).replaceAll(
              '\\',
              '/',
            );
            return specifier.startsWith('.') ? specifier : `./${specifier}`;
          };
          await write(
            relative(root, path),
            (await fs.readFile(path))
              .replaceAll("'@shop/contracts'", JSON.stringify(local('contract-surface.ts')))
              .replaceAll("'@database'", JSON.stringify(local('database.ts'))),
          );
        }
        const privateProcedure = `import { baseContract } from '@netscript/contracts';
import { implement } from '@orpc/server';
import { z } from 'zod';
const privateContract = { denied: baseContract.route({ method: 'POST', path: '/denied' })
  .meta({ access: { authentication: 'required', authorization: { scopes: ['fixture:denied'] } } })
  .output(z.object({ ok: z.boolean() })), protected: baseContract.route({ method: 'GET', path: '/private' })
  .meta({ access: { authentication: 'required' } }).output(z.object({ ok: z.boolean() })) };
const protectedProcedure = implement(privateContract).protected.handler(() => ({ ok: true }));
const deniedProcedure = implement(privateContract).denied.handler(() => { throw new Error('Denied handler ran'); });\n`;
        await write(
          `${prefix}router.ts`,
          privateProcedure + (await fs.readFile(join(root, prefix, 'router.ts')))
            .replace(
              '...createUsersV1(application),',
              '...createUsersV1(application), protected: protectedProcedure, denied: deniedProcedure,',
            ),
        );
        const mainPath = `${prefix}main.ts`;
        // Init formats main.ts before plugin install; test that exact L1-emitted shape too.
        await write(
          mainPath,
          await formatter.formatContent(
            join(root, mainPath),
            await fs.readFile(join(root, mainPath)),
          ),
        );
        // An explicit public opt-out must not claim an anonymous caller is authenticated.
        const publicMainPath = `${prefix}public-main.ts`;
        await write(
          publicMainPath,
          (await fs.readFile(join(root, mainPath)))
            .replace(
              'await defineService(router, {',
              'export const service = await defineService(router, {',
            ),
        );
        const publicGenerated: { service: RunningService } = await import(
          toFileUrl(resolve(root, publicMainPath)).href
        );
        try {
          const response = await publicGenerated.service.app.request('/api/users/session', {
            method: 'POST',
          });
          assertEquals(response.status, 200);
          assertEquals(await response.json(), { authenticated: false });
        } finally {
          await publicGenerated.service.stop();
        }
        if (!authFirst) await writeInstalledAuthFixture(fs, resolve(root));
        assertEquals(await readAuthServiceName(resolve(root), fs), 'auth');
        await reconcileBrowserAuth(resolve(root), fs, formatter);
        // Export the handle for deterministic teardown, leaving the reconciled options untouched.
        await write(
          mainPath,
          (await fs.readFile(join(root, mainPath)))
            .replace(
              'await defineService(router, {',
              'export const service = await defineService(router, {',
            ),
        );
        if (database) {
          await write(
            `${prefix}client-types.ts`,
            `import { createServiceClient } from '@netscript/sdk/client';
import { UsersContractV1, type UsersUserV1 } from './contract.ts';
const client = createServiceClient(UsersContractV1, { serviceName: 'users' });
const user: UsersUserV1 = await client.getById({ id: 1 });
console.log(user.name);`,
          );
        }
        const appRoutePath = join(root, 'apps/web/routes/examples/users/session.ts');
        const appSource = await fs.readFile(appRoutePath);
        assertStringIncludes(appSource, 'createBrowserSessionClient');
        assertEquals(appSource.includes('fetch('), false);
        const checked = await new DenoProcess().exec('deno', [
          'check',
          '--unstable-kv',
          join(root, mainPath),
          appRoutePath,
          ...(database ? [join(root, prefix, 'client-types.ts')] : []),
        ]);
        assertEquals(checked.code, 0, checked.stderr);
        const generated: { service: RunningService } = await import(
          toFileUrl(resolve(root, mainPath)).href
        );
        service = generated.service;
        const origin = `http://127.0.0.1:${service.addr.port}`;
        Deno.env.set('services__users__http__0', origin);
        const app: { handler: { GET(ctx: { req: Request }): Promise<Response> } } = await import(
          toFileUrl(resolve(appRoutePath)).href
        );
        const appRequest = (authenticated: boolean) =>
          new Request('https://app.example.test/examples/users/session', {
            headers: authenticated ? { cookie: `__Host-ns_session=${token}` } : {},
          });
        // Overlapping and subsequent calls must not retain another request's credential.
        for (const authenticated of [false, true, false]) {
          const response = await app.handler.GET({ req: appRequest(authenticated) });
          assertEquals(response.status, authenticated ? 200 : 401);
          assertEquals(response.headers.get('cache-control'), 'no-store');
          assertEquals(await response.json(), { authenticated });
        }
        const concurrent = await Promise.all([true, false].map(async (authenticated) => {
          const response = await app.handler.GET({ req: appRequest(authenticated) });
          await response.body?.cancel();
          return response.status;
        }));
        assertEquals(concurrent, [200, 401]);
        const actual: Record<string, number> = {};
        const expectedStatuses: Record<string, number> = {};
        const probe = async (path: string, expected: number, init?: RequestInit) => {
          const response = await fetch(`${origin}${path}`, init);
          await response.body?.cancel();
          assertEquals(response.status, expected, path);
          const key = `${path}:${expected}`;
          actual[key] = response.status;
          expectedStatuses[key] = expected;
        };
        await probe('/health', 200);
        const bearer = { authorization: `Bearer ${token}` };
        for (const path of ['/api/users/session', '/api/rpc/v1/users/session']) {
          await probe(path, 401, { method: 'POST' });
          await probe(path, 200, { method: 'POST', headers: bearer });
          await probe(path, 401, {
            method: 'POST',
            headers: { cookie: `__Host-ns_session=${token}` },
          });
        }
        for (const path of ['/api/denied', '/api/rpc/v1/users/denied']) {
          await probe(path, 401, { method: 'POST' });
          await probe(path, 403, { method: 'POST', headers: bearer });
        }
        await probe('/api/private', 200, { headers: bearer });
        await probe('/api/rpc/v1/users/protected', 200, { headers: bearer });
        await probe('/api/openapi.json', 200);
        await probe('/api/docs', 200);
        await probe('/api/private', 401);
        await probe('/api/rpc/v1/users/protected', 401);
        if (database) {
          await probe('/api/users?page=1', 200);
          await probe('/api/users/1', 200);
          await probe('/api/users/health', 200);
          await probe('/api/rpc/v1/users/list?data=%7B%22json%22%3A%7B%7D%7D', 200);
          await probe('/api/rpc/v1/users/getById?data=%7B%22json%22%3A%7B%22id%22%3A1%7D%7D', 200);
        } else {
          const init = {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ limit: 10, offset: 0 }),
          };
          await probe('/api/v1/users/list', 200, init);
          await probe('/api/rpc/v1/users/list', 200, {
            ...init,
            body: JSON.stringify({ json: { limit: 10, offset: 0 } }),
          });
        }
        assertEquals(actual, expectedStatuses);
      } finally {
        await service?.stop();
        for (const [key, value] of savedEnv) {
          if (value === undefined) Deno.env.delete(key);
          else Deno.env.set(key, value);
        }
        await Deno.remove(root, { recursive: true });
      }
    });
  }
}
