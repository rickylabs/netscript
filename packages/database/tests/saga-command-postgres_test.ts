import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import { prepareLockedFixture } from '../../../.llm/tools/testing/locked-fixture.ts';
import { appendPluginMigrations, pendingPluginMigrations } from '../scripts/plugin-migrations.ts';
import { verifySagaStatusUpgrade } from './saga-status-upgrade.ts';

for (const adoption of Deno.env.get('SAGA_COMMAND_TEST_FILTER') ? [false] : [false, true]) {
  Deno.test({
    name: `installed saga command schema and retention on real PostgreSQL (${
      adoption ? 'adoption' : 'fresh'
    })`,
    ignore: !Deno.env.get('COMMAND_POSTGRES_SOCKET'),
    async fn() {
      const temp = await Deno.makeTempDir();
      const namespace = 'saga_command_' + crypto.randomUUID().replaceAll('-', '');
      const configuredBin = Deno.env.get('COMMAND_POSTGRES_BIN');
      const nativeBin = configuredBin ??
        new TextDecoder().decode(
          (await new Deno.Command('pg_config', { args: ['--bindir'], stdout: 'piped' }).output())
            .stdout,
        ).trim();
      async function databaseTool(tool: string) {
        const result = await new Deno.Command(join(nativeBin, tool), {
          args: ['-h', Deno.env.get('COMMAND_POSTGRES_SOCKET')!, namespace],
          stdin: 'null',
          stdout: 'piped',
          stderr: 'piped',
        }).output();
        assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
      }
      await databaseTool('createdb');
      try {
        const installedPath = join(temp, 'installed.json');
        const install = await new Deno.Command(Deno.execPath(), {
          args: [
            'run',
            '--config',
            'packages/cli/deno.json',
            '-A',
            'packages/cli/tests/fixtures/install-saga-command-schema.ts',
            installedPath,
            ...(adoption ? ['adopt'] : []),
          ],
          stdin: 'null',
          stdout: 'piped',
          stderr: 'piped',
        }).output();
        assertEquals(install.code, 0, new TextDecoder().decode(install.stderr));
        const { copiedModel, installed }: {
          copiedModel: string;
          installed: { name: string; content: string }[];
        } = JSON.parse(await Deno.readTextFile(installedPath));
        const schemaPath = join(temp, 'schema');
        await Deno.mkdir(schemaPath);
        await Deno.writeTextFile(
          join(schemaPath, 'base.prisma'),
          `generator client {
 provider = "prisma-client"
 output = "../.generated"
 runtime = "deno"
}
datasource db {
 provider = "postgresql"
}
${copiedModel}`,
        );
        // First deploy the pre-fix schema and only its original outbox sidecar.
        // The upgrade below must add the column and backfill existing rows, not just fresh ones.
        for (const file of installed) {
          if (file.name.endsWith('instance-status.migration.sql')) continue;
          const legacy = file.content
            .replace(/^ {2}status\s+String[^\n]*\n/m, '')
            .replace(/^ {2}@@index\(\[sagaName, status\]\).*\n/m, '');
          await Deno.writeTextFile(join(schemaPath, file.name), legacy);
        }
        const rootConfig = JSON.parse(await Deno.readTextFile('deno.json'));
        const workspaceImports: Record<string, string> = {};
        const externalImports: Record<string, string> = { ...rootConfig.imports };
        const committed = JSON.parse(await Deno.readTextFile('deno.lock'));
        for (const [name, version] of Object.entries(rootConfig.catalog)) {
          const specifier = 'npm:' + name + '@' + version;
          if (specifier in committed.specifiers) externalImports[name] = specifier;
        }
        for (const parent of ['packages', 'plugins']) {
          for await (const member of Deno.readDir(parent)) {
            if (!member.isDirectory) continue;
            let config;
            try {
              config = JSON.parse(await Deno.readTextFile(`${parent}/${member.name}/deno.json`));
            } catch (error) {
              if (error instanceof Deno.errors.NotFound) continue;
              throw error;
            }
            for (const [key, specifier] of Object.entries(config.imports ?? {})) {
              if (
                typeof specifier === 'string' &&
                (specifier.startsWith('jsr:') ||
                  (specifier.startsWith('npm:') &&
                    Object.keys(externalImports).some((name) => key.startsWith(name + '/'))))
              ) externalImports[key] = specifier;
            }
            for (const [subpath, path] of Object.entries(config.exports ?? {})) {
              if (typeof path === 'string') {
                workspaceImports[config.name + (subpath === '.' ? '' : subpath.slice(1))] =
                  new URL(`../../../${parent}/${member.name}/${path}`, import.meta.url).href;
              }
            }
          }
        }
        await Deno.writeTextFile(
          join(temp, 'deno.json'),
          JSON.stringify({
            compilerOptions: { strict: true, isolatedDeclarations: false },
            catalog: rootConfig.catalog,
            imports: {
              ...externalImports,
              ...workspaceImports,
              zod: 'npm:zod@' + rootConfig.catalog.zod,
              '@netscript/database/commands/postgres':
                new URL('../commands-postgres.ts', import.meta.url).href,
              '@prisma/client': 'npm:@prisma/client@^7.10.0',
              '@prisma/adapter-pg': 'npm:@prisma/adapter-pg@^7.10.0',
              prisma: 'npm:prisma@7.10.0',
            },
          }),
        );
        let frozen = await prepareLockedFixture(temp);
        const prisma = async (args: string[]) => {
          const result = await new Deno.Command(Deno.execPath(), {
            args: [
              'run',
              ...frozen,
              '--config',
              join(temp, 'deno.json'),
              '-A',
              'npm:prisma@7.10.0',
              ...args,
            ],
            cwd: temp,
            stdin: 'null',
            stdout: 'piped',
            stderr: 'piped',
          }).output();
          const evidence = Deno.env.get('SAGA_COMMAND_ARTIFACTS');
          if (evidence) {
            await Deno.writeTextFile(
              join(evidence, 'prisma-' + args[0] + '-' + args[1] + '.log'),
              new TextDecoder().decode(result.stderr) + '\nSTDOUT\n' +
                new TextDecoder().decode(result.stdout),
            );
          }
          assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
          return new TextDecoder().decode(result.stdout);
        };
        const migrationsPath = join(temp, 'migrations');
        const user = encodeURIComponent(Deno.env.get('PGUSER') ?? 'postgres');
        const socket = encodeURIComponent(Deno.env.get('COMMAND_POSTGRES_SOCKET')!);
        const url = `postgresql://${user}@localhost:${
          Deno.env.get('PGPORT') ?? '5432'
        }/${namespace}?host=${socket}`;
        await Deno.writeTextFile(
          join(temp, 'prisma.config.ts'),
          `export default ${
            JSON.stringify({
              schema: schemaPath,
              migrations: { path: migrationsPath },
              datasource: { url },
            })
          };`,
        );
        const diffPath = join(temp, 'generated-migration.sql');
        await prisma([
          'migrate',
          'diff',
          '--config',
          join(temp, 'prisma.config.ts'),
          '--from-empty',
          '--to-schema',
          schemaPath,
          '--script',
          '--output',
          diffPath,
        ]);
        const migration = await Deno.readTextFile(diffPath);
        const evidence = Deno.env.get('SAGA_COMMAND_ARTIFACTS');
        if (evidence) {
          await Deno.writeTextFile(join(evidence, 'generated.sql'), migration);
          await Deno.writeTextFile(
            join(evidence, 'installed.json'),
            JSON.stringify({ copiedModel, installed }),
          );
        }
        const name = '20261031000000_installed_sagas';
        await Deno.mkdir(join(migrationsPath, name), { recursive: true });
        await Deno.writeTextFile(join(migrationsPath, name, 'migration.sql'), migration);
        await Deno.writeTextFile(
          join(migrationsPath, 'migration_lock.toml'),
          'provider = "postgresql"\n',
        );
        const pending = await pendingPluginMigrations(schemaPath, migrationsPath);
        assertEquals(pending.length, 1);
        await appendPluginMigrations(migrationsPath, [name], pending);
        await prisma(['migrate', 'deploy', '--config', join(temp, 'prisma.config.ts')]);
        await verifySagaStatusUpgrade({
          schemaPath,
          migrationsPath,
          configPath: join(temp, 'prisma.config.ts'),
          installed,
          prisma,
          async sql(query, success = true) {
            const result = await new Deno.Command(join(nativeBin, 'psql'), {
              args: [
                '-X',
                '-qAt',
                '-h',
                Deno.env.get('COMMAND_POSTGRES_SOCKET')!,
                '-d',
                namespace,
                '-v',
                'ON_ERROR_STOP=1',
                '-c',
                query,
              ],
              stdin: 'null',
              stdout: 'piped',
              stderr: 'piped',
            }).output();
            assertEquals(result.success, success, new TextDecoder().decode(result.stderr));
            return new TextDecoder().decode(result.stdout).trim();
          },
        });
        await prisma(['generate', '--schema', schemaPath]);
        const source = await Deno.readTextFile(
          new URL('./fixtures/saga-command/schema-conformance.ts.template', import.meta.url),
        );
        await Deno.writeTextFile(join(temp, 'schema-conformance_test.ts'), source);
        await Deno.copyFile(
          new URL('./fixtures/command-store/migration.sql', import.meta.url),
          join(temp, 'reference.sql'),
        );
        await Deno.copyFile(
          new URL('../../../plugins/sagas/database/command-outbox.migration.sql', import.meta.url),
          join(temp, 'constraints.sql'),
        );
        const retentionSource = (await Deno.readTextFile(
          new URL('./fixtures/saga-command/retention-conformance.ts.template', import.meta.url),
        ))
          .replaceAll(
            'RETENTION_MODULE',
            new URL(
              '../../plugin-sagas-core/src/stores/prisma-saga-command-retention.ts',
              import.meta.url,
            ).href,
          );
        await Deno.writeTextFile(join(temp, 'retention-conformance_test.ts'), retentionSource);
        frozen = await prepareLockedFixture(temp, [
          join(temp, 'schema-conformance_test.ts'),
          join(temp, 'retention-conformance_test.ts'),
        ]);
        const tested = await new Deno.Command(Deno.execPath(), {
          args: [
            'test',
            ...frozen,
            '--config',
            join(temp, 'deno.json'),
            '-A',
            '--unstable-kv',
            ...(Deno.env.get('SAGA_COMMAND_TEST_FILTER')
              ? ['--filter', Deno.env.get('SAGA_COMMAND_TEST_FILTER')!]
              : []),
            join(temp, 'schema-conformance_test.ts'),
            ...(adoption ? [] : [join(temp, 'retention-conformance_test.ts')]),
          ],
          cwd: temp,
          stdin: 'null',
          stdout: 'piped',
          stderr: 'piped',
          env: { SAGA_COMMAND_NAMESPACE: namespace },
        }).output();
        const childEvidence = Deno.env.get('SAGA_COMMAND_EVIDENCE');
        if (childEvidence) {
          await Deno.writeTextFile(
            childEvidence + (adoption ? '-adopt' : '-fresh'),
            new TextDecoder().decode(tested.stdout) + new TextDecoder().decode(tested.stderr),
          );
        }
        assertEquals(
          tested.code,
          0,
          new TextDecoder().decode(tested.stdout) + new TextDecoder().decode(tested.stderr),
        );
      } finally {
        await databaseTool('dropdb');
        await Deno.remove(temp, { recursive: true });
      }
    },
  });
}
