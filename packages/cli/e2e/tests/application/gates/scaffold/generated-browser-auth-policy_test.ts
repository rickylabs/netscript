import { assertEquals } from '@std/assert';
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
  Deno.test(`spliced generated ${database ? 'CRUD' : 'memory'} service keeps demo REST/RPC and discovery public`, async () => {
    await Deno.mkdir('.llm/tmp', { recursive: true });
    const root = await Deno.makeTempDir({ dir: '.llm/tmp', prefix: 'generated-auth-policy-' });
    const fs = new DenoFileSystem();
    const formatter = new DenoGeneratedSourceFormatter(new DenoProcess());
    let service: RunningService | undefined;
    const previousPort = Deno.env.get('PORT');
    Deno.env.set('PORT', '0');
    const write = async (path: string, content: string) => {
      await fs.createDir(join(root, path, '..'));
      await fs.writeFile(
        join(root, path),
        content
          .replaceAll("'@orpc/server'", JSON.stringify(SCAFFOLD_APP_IMPORTS['@orpc/server']))
          .replaceAll("'@orpc/contract'", JSON.stringify(SCAFFOLD_APP_IMPORTS['@orpc/contract']))
          .replaceAll("'zod'", JSON.stringify(SCAFFOLD_APP_IMPORTS.zod)),
      );
    };
    try {
      await write(
        'appsettings.json',
        JSON.stringify({
          NetScript: {
            Plugins: { auth: {} },
            Services: { users: { Workdir: 'services/users', Entrypoint: 'src/main.ts' } },
          },
        }),
      );
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
        `${prefix}contract.ts`,
        renderTemplateAssetSync(
          database ? TEMPLATE_KEYS.serviceContract : TEMPLATE_KEYS.serviceContractMemory,
          { serviceName: 'users', projectName: 'shop', modelName: 'User' },
        ).replace("'@database/zod'", "'./schemas.ts'"),
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
          const specifier = relative(dirname(path), join(root, prefix, name)).replaceAll('\\', '/');
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
const privateContract = { protected: baseContract.route({ method: 'GET', path: '/private' })
  .meta({ access: { authentication: 'required' } }).output(z.object({ ok: z.boolean() })) };
const protectedProcedure = implement(privateContract).protected.handler(() => ({ ok: true }));\n`;
      await write(
        `${prefix}router.ts`,
        privateProcedure + (await fs.readFile(join(root, prefix, 'router.ts')))
          .replace(
            '...createUsersV1(application),',
            '...createUsersV1(application), protected: protectedProcedure,',
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
      const checked = await new DenoProcess().exec('deno', [
        'check',
        '--unstable-kv',
        join(root, mainPath),
        ...(database ? [join(root, prefix, 'client-types.ts')] : []),
      ]);
      assertEquals(checked.code, 0, checked.stderr);
      const generated: { service: RunningService } = await import(
        toFileUrl(resolve(root, mainPath)).href
      );
      service = generated.service;
      const origin = `http://127.0.0.1:${service.addr.port}`;
      const actual: Record<string, number> = {};
      const expectedStatuses: Record<string, number> = {};
      const probe = async (path: string, expected: number, init?: RequestInit) => {
        const response = await fetch(`${origin}${path}`, init);
        await response.body?.cancel();
        actual[path] = response.status;
        expectedStatuses[path] = expected;
      };
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
      if (previousPort === undefined) Deno.env.delete('PORT');
      else Deno.env.set('PORT', previousPort);
      await Deno.remove(root, { recursive: true });
    }
  });
}
