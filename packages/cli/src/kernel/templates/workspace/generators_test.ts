/**
 * @module generators_test
 *
 * Structural tests for Tier 1 workspace generators.
 */

import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../application/registries/template-registry.ts';
import { netscriptJsrSpecifier } from '../../constants/jsr-specifiers.ts';
import { generateDenoJson } from './deno-json.ts';
import { generateNetScriptConfig } from './netscript-config.ts';
import { generateReadme } from './generate-readme.ts';

// `generateNetScriptConfig` reads templates synchronously, which requires a
// previously-awaited registry hydration. These tests call the generators
// directly (outside the CLI dispatch path), so hydrate at module load.
await DEFAULT_TEMPLATE_REGISTRY.hydrate();

Deno.test('generateDenoJson emits the expected root workspace shape in JSR mode', () => {
  const result = JSON.parse(generateDenoJson({
    name: 'test-project',
    appName: 'dashboard',
    workspaceMembers: ['contracts', 'plugins'],
    importMode: 'jsr',
  }));

  assertEquals(result.workspace, ['./contracts', './plugins']);
  assertEquals(result.imports, {
    '@netscript/contracts': netscriptJsrSpecifier('contracts'),
    '@netscript/kv': netscriptJsrSpecifier('kv'),
    '@netscript/plugin': netscriptJsrSpecifier('plugin'),
  });
  assertEquals(result.nodeModulesDir, 'auto');
  assertEquals(result.unstable, ['raw-imports', 'kv']);
  assertEquals(result.exclude, [
    '**/node_modules',
    '**/.data',
    'dotnet',
    '**/.git',
    'aspire/.aspire',
    'aspire/.helpers',
    '**/.generated',
  ]);
  assertEquals(result.tasks.dev, 'deno run --allow-all apps/dashboard/main.ts');
  assertEquals(result.tasks.check, 'deno check apps/**/*.ts services/**/*.ts contracts/**/*.ts');
  assertEquals(Object.keys(result.tasks), ['dev', 'check', 'lint', 'fmt', 'test']);
  assertEquals(Object.keys(result.fmt), [
    'useTabs',
    'lineWidth',
    'indentWidth',
    'semiColons',
    'singleQuote',
  ]);
});

Deno.test('generateDenoJson emits shared plugin service-context imports in JSR mode', () => {
  const result = JSON.parse(generateDenoJson({
    name: 'test-project',
    appName: 'dashboard',
    workspaceMembers: ['contracts', 'plugins'],
    importMode: 'jsr',
  }));
  assertEquals(result.imports, {
    '@netscript/contracts': netscriptJsrSpecifier('contracts'),
    '@netscript/kv': netscriptJsrSpecifier('kv'),
    '@netscript/plugin': netscriptJsrSpecifier('plugin'),
  });
});

Deno.test('generateDenoJson keeps the same root-only shape in local mode', () => {
  const result = JSON.parse(generateDenoJson({
    name: 'test-project',
    appName: 'dashboard',
    workspaceMembers: ['contracts', 'plugins'],
    importMode: 'local',
    localBase: '../..',
  }));

  assertEquals(result.workspace, ['./contracts', './plugins']);
  assertEquals(result.tasks.dev, 'deno run --allow-all apps/dashboard/main.ts');
  assert(!('imports' in result), 'root deno.json must not carry import maps');
});

Deno.test('generateDenoJson omits imports in local mode', () => {
  const result = JSON.parse(generateDenoJson({
    name: 'test-project',
    appName: 'dashboard',
    workspaceMembers: ['contracts', 'plugins'],
    importMode: 'local',
    localBase: '../..',
  }));
  assert(!('imports' in result), 'root deno.json must not carry import maps');
});

Deno.test('generateDenoJson expands copied workspace packages in stable order', () => {
  const result = JSON.parse(generateDenoJson({
    name: 'test-project',
    appName: 'dashboard',
    workspaceMembers: ['contracts', 'plugins'],
    importMode: 'local',
    localBase: '../..',
    packagesAsWorkspaceMembers: true,
    dbEngines: ['mysql'],
  }));

  assertEquals(result.workspace.slice(0, 2), ['./contracts', './plugins']);
  assertEquals(result.workspace.slice(2, 7), [
    './packages/aspire',
    './packages/cli',
    './packages/config',
    './packages/cron',
    './packages/database',
  ]);
  assertEquals(result.workspace[result.workspace.length - 1], './packages/prisma-adapter-mysql');
});

Deno.test('generateNetScriptConfig emits JSR guidance and stable section order', () => {
  const result = generateNetScriptConfig({
    name: 'test-project',
    importMode: 'jsr',
  });

  assertStringIncludes(result, '// TODO: When @netscript packages are published to JSR');
  assertStringIncludes(result, "import { defineConfig } from '@netscript/config';");
  assert(
    result.indexOf("import { defineConfig } from '@netscript/config';") <
      result.indexOf('export default defineConfig({'),
  );
  assert(
    result.indexOf('paths: {') < result.indexOf('logging: {') &&
      result.indexOf('logging: {') < result.indexOf('aspire: {'),
  );
  assertStringIncludes(result, "services: 'services'");
  assertStringIncludes(result, "apps: 'apps'");
  assertStringIncludes(result, "contracts: 'contracts'");
  assertStringIncludes(result, "plugins: 'plugins'");
  assertStringIncludes(result, "appHost: 'aspire/apphost.mts'");
});

Deno.test('generateNetScriptConfig switches to local imports without the JSR TODO banner', () => {
  const result = generateNetScriptConfig({
    name: 'test-project',
    importMode: 'local',
    localBase: '../..',
  });

  assertStringIncludes(result, "import { defineConfig } from '@netscript/config';");
  assert(!result.includes('// TODO: When @netscript packages are published to JSR'));
  assert(
    result.indexOf("import { defineConfig } from '@netscript/config';") <
      result.indexOf('export default defineConfig({'),
  );
});

Deno.test('generateReadme — TS AppHost with service + postgres', () => {
  const md = generateReadme({
    name: 'alpha-app',
    appName: 'dashboard',
    noAspire: false,
    legacyAspire: false,
    serviceName: 'users',
    dbEngine: 'postgres',
  });
  assertStringIncludes(md, '# AlphaApp');
  assertStringIncludes(md, 'aspire restore');
  assertStringIncludes(md, 'aspire run');
  assertStringIncludes(md, 'apphost.mts');
  assertStringIncludes(md, 'services/users');
  assertStringIncludes(md, 'PostgreSQL');
  assertStringIncludes(md, 'appsettings.json');
  assertStringIncludes(md, 'deno run -A packages/cli/bin/netscript-dev.ts --help');
  assertStringIncludes(md, 'deno run -A packages/cli/bin/netscript.ts --help');
  assertStringIncludes(
    md,
    'Use `packages/cli/bin/netscript-dev.ts` for local contributor workflows',
  );
  assertStringIncludes(md, 'deno run -A packages/cli/bin/netscript-dev.ts db init --name init');
  assertStringIncludes(md, 'deno run -A packages/cli/bin/netscript-dev.ts db generate');
  assertStringIncludes(md, 'deno run -A packages/cli/bin/netscript-dev.ts db seed');
  assertStringIncludes(md, 'deno run -A packages/cli/bin/netscript-dev.ts db status');
  assertStringIncludes(md, '`users.health.check` via `/api/rpc`');
  assert(!md.includes('dotnet run'), 'TS AppHost README should not mention dotnet run');
});

Deno.test('generateReadme — legacy C# AppHost', () => {
  const md = generateReadme({
    name: 'legacy-app',
    appName: 'dashboard',
    noAspire: false,
    legacyAspire: true,
    dbEngine: 'none',
  });
  assertStringIncludes(md, 'dotnet run --project dotnet/AppHost');
  assertStringIncludes(md, 'dotnet/');
  assert(!md.includes('aspire run'), 'legacy README should not mention aspire run');
  assert(!md.includes('services/'), 'README should omit services section when no service');
  assert(!md.includes('## Database'), 'README should omit database section when dbEngine=none');
});

Deno.test('generateReadme — no aspire points at app dev task', () => {
  const md = generateReadme({
    name: 'no-aspire-app',
    appName: 'dashboard',
    noAspire: true,
    legacyAspire: false,
    dbEngine: 'none',
  });
  assertStringIncludes(md, 'deno task --cwd apps/dashboard dev');
  assert(!md.includes('aspire run'), 'no-aspire README must not mention aspire run');
  assert(!md.includes('dotnet run'), 'no-aspire README must not mention dotnet run');
  assert(!md.includes('appsettings.json'), 'no-aspire README must not list appsettings.json');
});

Deno.test('generateReadme — no aspire postgres asks for self-provisioning', () => {
  const md = generateReadme({
    name: 'no-aspire-app',
    appName: 'dashboard',
    noAspire: true,
    legacyAspire: false,
    dbEngine: 'postgres',
  });
  assertStringIncludes(md, 'Primary database: **PostgreSQL**.');
  assertStringIncludes(md, 'Self-provision the database');
  assertStringIncludes(md, '`POSTGRES_URI` or `DATABASE_URL`');
  assert(!md.includes('Aspire orchestration layer provisions it'));
  assert(!md.includes('appsettings.json'), 'no-aspire README must not mention appsettings.json');
});

Deno.test('generateReadme — sqlite gets non-persistent note', () => {
  const md = generateReadme({
    name: 'sqlite-app',
    appName: 'dashboard',
    noAspire: false,
    legacyAspire: false,
    dbEngine: 'sqlite',
  });
  assertStringIncludes(md, 'SQLite');
  assertStringIncludes(md, 'Persistent: true');
});

Deno.test('generateReadme — mysql gets persistent-container note', () => {
  const md = generateReadme({
    name: 'mysql-app',
    appName: 'dashboard',
    noAspire: false,
    legacyAspire: false,
    dbEngine: 'mysql',
  });
  assertStringIncludes(md, 'MySQL');
  assertStringIncludes(md, 'Persistent: false');
});
