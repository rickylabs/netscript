import { assertEquals } from 'jsr:@std/assert@^1';
import type { ValidatedInitOptions } from '../../domain/scaffold/scaffold-options.ts';
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
