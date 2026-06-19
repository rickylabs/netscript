import { assertEquals } from 'jsr:@std/assert@^1';
import { join } from 'jsr:@std/path@^1';
import { InMemoryScaffolder } from '../testing/in-memory-scaffolder.ts';
import type { ValidatedInitOptions } from '../../domain/scaffold/scaffold-options.ts';
import type { ScaffoldResult } from '../../domain/core-types.ts';
import { initNextSteps } from './orchestrate-init.ts';

function baseOptions(overrides: Partial<ValidatedInitOptions> = {}): ValidatedInitOptions {
  return {
    name: 'smoke-test',
    appName: 'frontend',
    targetPath: '/tmp/smoke-test',
    importMode: 'jsr',
    editor: 'none',
    force: false,
    ci: true,
    dryRun: false,
    noGit: true,
    noAspire: false,
    legacyAspire: false,
    dbEngine: 'none',
    includeExampleService: false,
    ...overrides,
  };
}

Deno.test('initNextSteps includes public database preparation steps for JSR init', () => {
  const steps = initNextSteps(baseOptions({ dbEngine: 'postgres' }));

  assertEquals(steps, [
    'cd smoke-test',
    'cd aspire  # TS AppHost lives here, isolated from the Deno workspace',
    'aspire restore  # download TypeScript AppHost SDK modules (run once)',
    'cd ..',
    'netscript db init --name init',
    'netscript db generate',
    'netscript db seed',
    'cd aspire',
    'aspire run  # start TypeScript AppHost',
    '# Postgres provisioned by Aspire (see "Databases" in appsettings.json)',
  ]);
});

Deno.test('InMemoryScaffolder writes rendered files without a temp directory', async () => {
  const started = performance.now();
  const scaffolder = new InMemoryScaffolder();

  await scaffolder.createDir('/workspace');
  const wrote = await scaffolder.scaffoldFile('name={{name}}', join('/workspace', 'app.txt'), {
    name: 'alpha',
  });
  const result: ScaffoldResult = await scaffolder.scaffold({
    templatePath: '/templates',
    targetPath: '/workspace/generated',
    variables: {},
  });

  assertEquals(wrote, true);
  assertEquals(await scaffolder.exists('/workspace/app.txt'), true);
  assertEquals(scaffolder.files.get('/workspace/app.txt'), 'name=alpha');
  assertEquals(result.directoriesCreated, ['/workspace/generated']);
  assertEquals(performance.now() - started < 100, true);
});

Deno.test('initNextSteps includes local database preparation steps for maintainer init', () => {
  const steps = initNextSteps(baseOptions({
    importMode: 'local',
    localBase: '.',
    dbEngine: 'postgres',
  }));

  assertEquals(steps, [
    'cd smoke-test',
    'cd aspire  # TS AppHost lives here, isolated from the Deno workspace',
    'aspire restore  # download TypeScript AppHost SDK modules (run once)',
    'cd ..',
    'deno run -A packages/cli/bin/netscript-dev.ts db init --name init',
    'deno run -A packages/cli/bin/netscript-dev.ts db generate',
    'deno run -A packages/cli/bin/netscript-dev.ts db seed',
    'cd aspire',
    'aspire run  # start TypeScript AppHost',
    '# Postgres provisioned by Aspire (see "Databases" in appsettings.json)',
  ]);
});

Deno.test('initNextSteps tells no-Aspire Postgres users to self-provision', () => {
  const steps = initNextSteps(baseOptions({
    noAspire: true,
    dbEngine: 'postgres',
  }));

  assertEquals(steps, [
    'cd smoke-test',
    'netscript db generate  # generate database client after configuring DATABASE_URL',
    'netscript db seed  # seed after the generated client exists',
    'deno task --cwd apps/frontend dev  # start Fresh dev server',
    '# Provision Postgres yourself and set POSTGRES_URI or DATABASE_URL',
  ]);
});

Deno.test('initNextSteps reports the generated service oRPC endpoint under /api/rpc', () => {
  const steps = initNextSteps(baseOptions({
    includeExampleService: true,
    serviceName: 'users',
    servicePort: 3001,
  }));

  assertEquals(
    steps.at(-1),
    '# oRPC service "users" at http://localhost:3001/api/rpc',
  );
});
