import { prepareLockedFixture } from '../../../../../../.llm/tools/testing/locked-fixture.ts';
import { checkGeneratedFiles } from '../../../../../../.llm/tools/testing/check-generated-files.ts';
import { assertEquals, assertStringIncludes } from '@std/assert';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../application/registries/template-registry.ts';
import { DbEngineRegistry } from '../../application/registries/db-engine-registry.ts';
import { generateEngineMod } from './generate-engine-mod.ts';
import { generatePrismaConfig } from './generate-prisma-config.ts';
import { generateDatabaseDenoJson } from './generate-db-deno-json.ts';
import { generateDenoJson } from '../workspace/deno-json.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();
const provider = new DbEngineRegistry().get('postgres');
const sourceRoot = new URL('../../../../../../', import.meta.url).pathname;
const npgsql = 'Host=localhost;Database=app;Username=app;Password=secret;SSL Mode=VerifyFull';
const verifyFullUrl = 'postgres://app:secret@localhost:5432/app?sslmode=verify-full';
const duplicateInputs = [
  'Host=h;SSL Mode=Require;SslMode=Disable',
  'Host=h;hOsT=h',
  'Password="sensitive;""bytes=one";Pwd=sensitive-two',
];

async function withFixture(
  mode: 'local' | 'jsr',
  run: (root: string, database: string) => Promise<void>,
): Promise<void> {
  const root = await Deno.makeTempDir({ prefix: 'netscript-postgres-normalizer-' });
  const database = `${root}/database/postgres`;
  try {
    await Deno.mkdir(`${database}/schema/.generated`, { recursive: true });
    const rootConfig = JSON.parse(generateDenoJson({
      name: 'fixture',
      appName: 'dashboard',
      workspaceMembers: mode === 'local'
        ? ['database/postgres', 'packages/database']
        : ['database/postgres'],
      importMode: mode,
      noAspire: true,
      localBase: root,
    }));
    const databaseConfig = generateDatabaseDenoJson(provider, {
      projectName: 'fixture',
      importMode: mode,
      localBase: root,
    });
    if (mode === 'local') {
      // Local scaffolds copy framework source. Keep the real tracing module in
      // its own workspace so the generated local mapping resolves unchanged.
      const framework = `${root}/packages/database`;
      await Deno.mkdir(framework, { recursive: true });
      await Deno.copyFile(
        `${sourceRoot}/packages/database/prisma-tracing.ts`,
        `${framework}/prisma-tracing.ts`,
      );
      const imports = JSON.parse(databaseConfig).imports;
      await Deno.writeTextFile(
        `${framework}/deno.json`,
        JSON.stringify({
          name: '@netscript/database',
          exports: { './tracing': './prisma-tracing.ts' },
          imports: {
            '@prisma/instrumentation-contract': imports['@prisma/instrumentation-contract'],
            '@opentelemetry/api': imports['@opentelemetry/api'],
          },
        }),
      );
    }
    await Deno.writeTextFile(`${root}/deno.json`, JSON.stringify(rootConfig));
    await Deno.writeTextFile(
      `${database}/deno.json`,
      databaseConfig,
    );
    await Deno.writeTextFile(
      `${database}/prisma.config.ts`,
      generatePrismaConfig(provider, {
        configKey: 'postgres',
      }),
    );
    await Deno.writeTextFile(
      `${database}/mod.ts`,
      generateEngineMod(provider, {
        configKey: 'postgres',
      }),
    );
    // Only the application's schema-specific client is a stub. The rendered modules,
    // generated import maps, shared normalizer and PrismaPg are exercised unchanged.
    await Deno.writeTextFile(
      `${database}/schema/.generated/client.server.ts`,
      `
export class PrismaClient {
  constructor(_options: { adapter: unknown }) {}
  $disconnect(): Promise<void> { return Promise.resolve(); }
  $queryRawUnsafe(_query: string): Promise<unknown> { return Promise.resolve([]); }
}
`,
    );
    await prepareLockedFixture(
      root,
      [],
      new URL('../../../../tests/fixtures/postgres-normalizer/deno.lock', import.meta.url),
    );
    await run(root, database);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

async function probe(
  root: string,
  database: string,
  script: string,
  input: string,
  expected: string,
): Promise<void> {
  await Deno.writeTextFile(`${database}/probe.ts`, script);
  await prepareLockedFixture(
    root,
    [`${database}/probe.ts`],
    new URL('../../../../tests/fixtures/postgres-normalizer/deno.lock', import.meta.url),
  );
  const result = await new Deno.Command('deno', {
    args: ['run', '-A', '--config', `${root}/deno.json`, 'probe.ts'],
    cwd: database,
    env: { POSTGRES_URI: input, DATABASE_URL: input, EXPECTED_URL: expected, OTEL_DENO: 'false' },
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
  assertStringIncludes(new TextDecoder().decode(result.stdout), 'generated normalizer: PASS');
}

const prismaProbe = `
import { loadConfigFromFile } from 'npm:@prisma/config@^7.10.0';
// Resolve the same npm config package the generated file imports before using jiti.
import 'prisma/config';
const result = await loadConfigFromFile({ configFile: 'prisma.config.ts', configRoot: Deno.cwd() });
const expected = Deno.env.get('EXPECTED_URL');
if (expected === 'unsupported-value' || expected === 'duplicate-key') {
  if (!result.error || !('error' in result.error) ||
      result.error.error.name !== 'PostgresConnectionStringError' ||
      result.error.error.reason !== expected ||
      !result.error.error.message.includes(expected)) {
    throw new Error('Generated config did not preserve its typed refusal');
  }
  const diagnostics = result.error.error.message + JSON.stringify(result.error.error);
  if (diagnostics.includes('sensitive') || result.error.error.cause !== undefined) {
    throw new Error('Generated config refusal exposed credentials');
  }
} else {
  if (result.error) throw new Error('Actual Prisma loader failed: ' + JSON.stringify(result.error));
  if (result.config.datasource?.url !== expected) {
    throw new Error('Generated config did not preserve TLS or trimming: ' + result.config.datasource?.url);
  }
}
console.log('generated normalizer: PASS');
`;

for (const mode of ['local', 'jsr'] as const) {
  Deno.test(`Postgres generated Prisma config loads through actual jiti (${mode}) and preserves TLS, trim and refusals`, async () => {
    await withFixture(mode, async (root, database) => {
      await probe(root, database, prismaProbe, npgsql, verifyFullUrl);
      await probe(root, database, prismaProbe, `  ${verifyFullUrl}\n`, verifyFullUrl);
      for (const sslmode of ['verify-ca', 'verify-full']) {
        await probe(
          root,
          database,
          prismaProbe,
          'Host=localhost;Port=05432;SSL Mode=' + sslmode,
          'postgres://postgres:@localhost:5432/postgres?sslmode=' + sslmode,
        );
      }
      await probe(
        root,
        database,
        prismaProbe,
        'Host=localhost;SSL Mode=Allow',
        'unsupported-value',
      );
    });
  });

  Deno.test(`Postgres generated Prisma config duplicate refusal (${mode})`, async () => {
    await withFixture(mode, async (root, database) => {
      for (const input of duplicateInputs) {
        await probe(root, database, prismaProbe, input, 'duplicate-key');
      }
    });
  });
}

Deno.test('Postgres generated engine type-checks and runs with its generated local import map', async () => {
  await withFixture('local', async (root, database) => {
    const check = await checkGeneratedFiles({
      args: [
        'check',
        '--unstable-kv',
        '--config',
        `${root}/deno.json`,
        'mod.ts',
        'prisma.config.ts',
      ],
      cwd: database,
    });
    assertEquals(check.code, 0, new TextDecoder().decode(check.stderr));
    const engineProbe = `
import { getPostgres } from './mod.ts';
await getPostgres();
const expected = Deno.env.get('EXPECTED_URL');
if (Deno.env.get('DATABASE_URL') !== expected || Deno.env.get('POSTGRES_URI') !== expected) {
  throw new Error('Generated engine did not pass the normalized TLS URL to its client');
}
console.log('generated normalizer: PASS');
`;
    await probe(root, database, engineProbe, npgsql, verifyFullUrl);
    await probe(root, database, engineProbe, `  ${verifyFullUrl}\n`, verifyFullUrl);
  });
});

Deno.test('Postgres generated engine duplicate refusal preserves credentials and environment', async () => {
  await withFixture('local', async (root, database) => {
    const engineRefusalProbe = `
import { getPostgres } from './mod.ts';
const input = Deno.env.get('POSTGRES_URI');
let refused = false;
try {
  await getPostgres();
} catch (error) {
  if (!(error instanceof Error) || error.name !== 'PostgresConnectionStringError' ||
      !('reason' in error) || error.reason !== 'duplicate-key') {
    throw new Error('Generated engine did not preserve its typed duplicate refusal');
  }
  const diagnostics = error.message + error.stack + JSON.stringify(error);
  if (diagnostics.includes('sensitive') || error.cause !== undefined) {
    throw new Error('Generated engine refusal exposed credentials');
  }
  refused = true;
}
if (!refused) throw new Error('Generated engine accepted duplicate options');
if (Deno.env.get('POSTGRES_URI') !== input || Deno.env.get('DATABASE_URL') !== input) {
  throw new Error('Generated engine changed environment before refusing duplicate options');
}
console.log('generated normalizer: PASS');
`;
    for (const input of duplicateInputs) {
      await probe(root, database, engineRefusalProbe, input, 'duplicate-key');
    }
  });
});
