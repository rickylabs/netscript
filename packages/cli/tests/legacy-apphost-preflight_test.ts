/**
 * Pre-mutation legacy Node.js AppHost (`aspire/package.json`) refusal tests.
 *
 * Verifies that `db add`, `db remove --purge`, `service add`, and `service generate`
 * fail closed BEFORE any file mutation or deletion across both legacy shapes
 * (`aspire/package.json` alone AND coexisting with `aspire/deno.json`), leaving
 * every workspace file — including `.data/aspire-secrets/` and `database/` —
 * byte-identical.
 */

import { assertEquals, assertRejects } from '@std/assert';
import { walk } from '@std/fs';
import { join, relative } from '@std/path';
import { ScaffoldValidationError } from '../src/kernel/domain/errors.ts';
import { createPublicCommandDependencies } from '../src/public/features/root/public-command-dependencies.ts';
import { addDb } from '../src/public/features/db/add/add-db.ts';
import { createDbRemoveCommand } from '../src/public/features/db/remove/remove-db-command.ts';
import { addService } from '../src/public/features/services/add/add-service.ts';
import { createServiceGenerateCommand } from '../src/public/features/services/generate/generate-service-command.ts';

type LegacyShape = 'package-json-only' | 'coexisting-package-and-deno-json';

async function snapshotWorkspace(root: string): Promise<Record<string, string>> {
  const snapshot: Record<string, string> = {};
  for await (const entry of walk(root, { includeDirs: false })) {
    const rel = relative(root, entry.path).replaceAll('\\', '/');
    snapshot[rel] = await Deno.readTextFile(entry.path);
  }
  return Object.fromEntries(Object.entries(snapshot).sort(([a], [b]) => a.localeCompare(b)));
}

async function seedLegacyWorkspace(root: string, shape: LegacyShape): Promise<void> {
  const files: Record<string, string> = {
    'deno.json': JSON.stringify(
      {
        workspace: ['./database/postgres'],
        imports: {},
      },
      null,
      2,
    ) + '\n',
    'appsettings.json': JSON.stringify(
      {
        NetScript: {
          Name: 'legacy-shop',
          Version: '1.0.0',
          PrimaryDatabase: 'postgres',
          Otel: { HttpEndpoint: 'http://localhost:4318', Protocol: 'http/protobuf' },
          Defaults: { Deno: { Permissions: ['--allow-net'], WatchMode: false } },
          Databases: {
            postgres: {
              Enabled: true,
              Engine: 'Postgres',
              Mode: 'Container',
              DatabaseName: 'legacy_shop',
              Persistent: true,
              DataPath: '.data/postgres',
            },
          },
          Cache: {},
          Services: {},
          Plugins: {},
          BackgroundProcessors: {},
          Apps: {},
          Tools: {},
        },
      },
      null,
      2,
    ) + '\n',
    'database/postgres/deno.json': JSON.stringify({ name: '@legacy-shop/db-postgres' }, null, 2) +
      '\n',
    'database/postgres/schema/schema.prisma': 'datasource db { provider = "postgresql" }\n',
    '.data/aspire-secrets/postgres.password': '0123456789abcdef0123456789abcdef\n',
    'aspire/package.json': JSON.stringify(
      { name: 'legacy-shop-apphost', dependencies: { 'vscode-jsonrpc': '8.2.0' } },
      null,
      2,
    ) + '\n',
    'aspire/aspire.config.json': JSON.stringify({ sdk: { version: '13.5.3' } }, null, 2) + '\n',
  };
  if (shape === 'coexisting-package-and-deno-json') {
    files['aspire/deno.json'] = JSON.stringify({ imports: {} }, null, 2) + '\n';
  }
  for (const [relPath, content] of Object.entries(files)) {
    const abs = join(root, relPath);
    await Deno.mkdir(join(abs, '..'), { recursive: true });
    await Deno.writeTextFile(abs, content);
  }
}

for (
  const shape of [
    'package-json-only',
    'coexisting-package-and-deno-json',
  ] as const
) {
  Deno.test(`db add, db remove --purge, service add, and service generate fail closed with zero mutations (${shape})`, async () => {
    const root = await Deno.makeTempDir({ prefix: `legacy-apphost-${shape}-` });
    try {
      await seedLegacyWorkspace(root, shape);
      const before = await snapshotWorkspace(root);

      const publicDeps = createPublicCommandDependencies({
        cwd: () => root,
        resolvePath: (path?: string) => (path ? join(root, path) : root),
      });

      // 1. `db add` must fail before creating database/sqlite or editing appsettings.json / deno.json
      await assertRejects(
        () =>
          addDb(
            {
              projectRoot: root,
              engine: 'sqlite',
              configKey: 'analytics',
              overwrite: false,
            },
            publicDeps.dbAddDependencies,
          ),
        ScaffoldValidationError,
        'Legacy Node.js Aspire AppHost detected',
      );
      assertEquals(await snapshotWorkspace(root), before, 'db add mutated workspace');

      // 2. `db remove --purge` must fail BEFORE deleting database/postgres or editing appsettings.json
      const removeCmd = createDbRemoveCommand(publicDeps);
      await assertRejects(
        () => removeCmd.parse(['postgres', '--purge', '--project-root', root]),
        ScaffoldValidationError,
        'Legacy Node.js Aspire AppHost detected',
      );
      assertEquals(
        await snapshotWorkspace(root),
        before,
        'db remove --purge mutated or purged workspace',
      );

      // 3. `service add` must fail BEFORE creating services/billing or editing appsettings.json
      await assertRejects(
        () =>
          addService(
            {
              serviceName: 'billing',
              serviceReferences: [],
              projectRoot: root,
              withClient: false,
              overwrite: false,
            },
            publicDeps.serviceAddDependencies,
          ),
        ScaffoldValidationError,
        'Legacy Node.js Aspire AppHost detected',
      );
      assertEquals(await snapshotWorkspace(root), before, 'service add mutated workspace');

      // 4. `service generate` must fail BEFORE generating clients or writing helpers
      let clientsGenerated = false;
      const serviceGenCmd = createServiceGenerateCommand({
        generateAspireDependencies: {
          fs: publicDeps.serviceAddDependencies.fs,
          scaffolder: publicDeps.serviceAddDependencies.scaffolder,
          templateAdapter: publicDeps.serviceAddDependencies.templateAdapter,
          formatter: publicDeps.serviceAddDependencies.formatter,
        },
        generateServiceClientsDependencies: {} as never,
        resolveProjectRoot: () => Promise.resolve(root),
        generateClients: () => {
          clientsGenerated = true;
          return Promise.resolve({ dryRun: false, planned: [], written: [], skipped: [] });
        },
      });
      await assertRejects(
        () => serviceGenCmd.parse(['--project-root', root]),
        ScaffoldValidationError,
        'Legacy Node.js Aspire AppHost detected',
      );
      assertEquals(clientsGenerated, false, 'service generate ran client generation before guard');
      assertEquals(await snapshotWorkspace(root), before, 'service generate mutated workspace');
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
}
