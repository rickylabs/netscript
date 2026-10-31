import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import { prepareLockedFixture } from '../../../.llm/tools/testing/locked-fixture.ts';
import { appendPluginMigrations, pendingPluginMigrations } from '../scripts/plugin-migrations.ts';

for (const adoption of [false, true]) {
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
        for (const file of installed) {
          await Deno.writeTextFile(join(schemaPath, file.name), file.content);
        }
        await Deno.writeTextFile(
          join(temp, 'deno.json'),
          JSON.stringify({
            compilerOptions: { strict: true, isolatedDeclarations: false },
            imports: {
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
        frozen = await prepareLockedFixture(temp, [join(temp, 'schema-conformance_test.ts')]);
        const tested = await new Deno.Command(Deno.execPath(), {
          args: [
            'test',
            ...frozen,
            '--config',
            join(temp, 'deno.json'),
            '-A',
            join(temp, 'schema-conformance_test.ts'),
          ],
          cwd: temp,
          stdin: 'null',
          stdout: 'piped',
          stderr: 'piped',
          env: { SAGA_COMMAND_NAMESPACE: namespace },
        }).output();
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
