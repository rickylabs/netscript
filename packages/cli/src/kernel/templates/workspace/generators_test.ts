/**
 * @module generators_test
 *
 * Structural tests for Tier 1 workspace generators.
 */

import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../application/registries/template-registry.ts';
import {
  SCAFFOLD_JSR_RELEASE_PACKAGES,
} from '../../constants/scaffold/scaffold-workspace-packages.ts';
import {
  NETSCRIPT_RELEASE_VERSION,
  netscriptJsrSpecifier,
} from '../../constants/jsr-specifiers.ts';
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
    '@netscript/config': netscriptJsrSpecifier('config'),
    '@netscript/contracts': netscriptJsrSpecifier('contracts'),
    '@netscript/kv': netscriptJsrSpecifier('kv'),
    '@netscript/plugin': netscriptJsrSpecifier('plugin'),
  });
  assertEquals(result.minimumDependencyAge, {
    age: 'P1D',
    exclude: SCAFFOLD_JSR_RELEASE_PACKAGES.map((packageName) =>
      netscriptJsrSpecifier(packageName)
    ),
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
  assertEquals(
    result.tasks.check,
    'deno check apps/**/*.ts services/**/*.ts contracts/**/*.ts',
  );
  assertEquals(Object.keys(result.tasks), [
    'dev',
    'check',
    'lint',
    'fmt',
    'test',
  ]);
  assertEquals(Object.keys(result.fmt), [
    'useTabs',
    'lineWidth',
    'indentWidth',
    'semiColons',
    'singleQuote',
  ]);
});

Deno.test('generateDenoJson scopes the minimum dependency age exception to exact NetScript releases', () => {
  const result = JSON.parse(generateDenoJson({
    name: 'test-project',
    appName: 'dashboard',
    workspaceMembers: ['contracts', 'plugins'],
    importMode: 'jsr',
  }));
  const exclusions = result.minimumDependencyAge.exclude as string[];

  assertEquals(exclusions, [
    ...SCAFFOLD_JSR_RELEASE_PACKAGES.map((packageName) =>
      `jsr:@netscript/${packageName}@${NETSCRIPT_RELEASE_VERSION}`
    ),
  ]);
  assertEquals(new Set(exclusions).size, exclusions.length);
  assert(exclusions.every((specifier) => specifier.startsWith('jsr:@netscript/')));
  assert(exclusions.every((specifier) => specifier.endsWith(`@${NETSCRIPT_RELEASE_VERSION}`)));
  assert(!exclusions.some((specifier) => specifier.includes('@std/')));
});

Deno.test('generateDenoJson emits shared plugin service-context imports in JSR mode', () => {
  const result = JSON.parse(generateDenoJson({
    name: 'test-project',
    appName: 'dashboard',
    workspaceMembers: ['contracts', 'plugins'],
    importMode: 'jsr',
  }));
  assertEquals(result.imports, {
    '@netscript/config': netscriptJsrSpecifier('config'),
    '@netscript/contracts': netscriptJsrSpecifier('contracts'),
    '@netscript/kv': netscriptJsrSpecifier('kv'),
    '@netscript/plugin': netscriptJsrSpecifier('plugin'),
  });
});

Deno.test('generateDenoJson maps @database/zod for the selected database engine', () => {
  const result = JSON.parse(generateDenoJson({
    name: 'test-project',
    appName: 'dashboard',
    workspaceMembers: ['contracts', 'database/postgres'],
    importMode: 'jsr',
    dbEngines: ['postgres'],
  }));

  assertEquals(
    result.imports['@database/zod'],
    './database/postgres/schema/.generated/zod/crud.ts',
  );
});

Deno.test('generateDenoJson keeps generated database aliases in local mode', () => {
  const result = JSON.parse(generateDenoJson({
    name: 'test-project',
    appName: 'dashboard',
    workspaceMembers: ['contracts', 'database/sqlite'],
    importMode: 'local',
    localBase: '../..',
    dbEngines: ['sqlite'],
  }));

  assertEquals(result.imports, {
    '@database/zod': './database/sqlite/schema/.generated/zod/crud.ts',
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
  assert(
    !('minimumDependencyAge' in result),
    'local root deno.json must not carry registry age policy',
  );
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
    './packages/ai',
    './packages/aspire',
    './packages/cli',
    './packages/config',
    './packages/cron',
  ]);
  assertEquals(
    result.workspace[result.workspace.length - 1],
    './packages/prisma-adapter-mysql',
  );
});

Deno.test('generateNetScriptConfig emits the JSR import and stable section order', () => {
  const result = generateNetScriptConfig({
    name: 'test-project',
    importMode: 'jsr',
  });

  assert(
    !result.includes('// TODO: When @netscript packages are published to JSR'),
  );
  assertStringIncludes(
    result,
    "import { defineConfig } from '@netscript/config';",
  );
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

  assertStringIncludes(
    result,
    "import { defineConfig } from '@netscript/config';",
  );
  assert(
    !result.includes('// TODO: When @netscript packages are published to JSR'),
  );
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
    serviceName: 'users',
    dbEngine: 'postgres',
  });
  assertStringIncludes(md, '# AlphaApp');
  assertStringIncludes(md, 'aspire restore');
  assertStringIncludes(md, 'aspire start');
  assertStringIncludes(md, 'apphost.mts');
  assertStringIncludes(md, 'services/users');
  assertStringIncludes(md, 'PostgreSQL');
  assertStringIncludes(md, 'appsettings.json');
  assertStringIncludes(
    md,
    'deno run -A packages/cli/bin/netscript-dev.ts --help',
  );
  assertStringIncludes(md, 'deno run -A packages/cli/bin/netscript.ts --help');
  assertStringIncludes(
    md,
    'Use `packages/cli/bin/netscript-dev.ts` for local contributor workflows',
  );
  assertStringIncludes(
    md,
    'deno run -A packages/cli/bin/netscript-dev.ts db init --name init',
  );
  assertStringIncludes(
    md,
    'deno run -A packages/cli/bin/netscript-dev.ts db generate',
  );
  assertStringIncludes(
    md,
    'deno run -A packages/cli/bin/netscript-dev.ts db seed',
  );
  assertStringIncludes(
    md,
    'deno run -A packages/cli/bin/netscript-dev.ts db status',
  );
  assertStringIncludes(md, 'deploy-compose-ghcr.yml');
  assertStringIncludes(md, 'deploy-deno-deploy.yml');
  assertStringIncludes(md, 'deploy-bare-metal.yml');
  assertStringIncludes(
    md,
    '`development` first, then `staging`, then `production`',
  );
  assertStringIncludes(md, '--clear-cache');
  assertStringIncludes(md, '~/.aspire/deployments');
  assertStringIncludes(md, '`users.health.check` via `/api/rpc`');
  assert(
    !md.includes('dotnet run'),
    'TS AppHost README should not mention dotnet run',
  );
  assert(
    !md.includes('aspire run'),
    'TS AppHost README should not mention aspire run',
  );
});

Deno.test('generateReadme — no aspire points at app dev task', () => {
  const md = generateReadme({
    name: 'no-aspire-app',
    appName: 'dashboard',
    noAspire: true,
    dbEngine: 'none',
  });
  assertStringIncludes(md, 'deno task --cwd apps/dashboard dev');
  assert(
    !md.includes('aspire run'),
    'no-aspire README must not mention aspire run',
  );
  assert(
    !md.includes('dotnet run'),
    'no-aspire README must not mention dotnet run',
  );
  assert(
    !md.includes('appsettings.json'),
    'no-aspire README must not list appsettings.json',
  );
  assert(
    !md.includes('## Deployment CI'),
    'no-aspire README should not describe Aspire CI',
  );
});

Deno.test('generateReadme — no aspire postgres asks for self-provisioning', () => {
  const md = generateReadme({
    name: 'no-aspire-app',
    appName: 'dashboard',
    noAspire: true,
    dbEngine: 'postgres',
  });
  assertStringIncludes(md, 'Primary database: **PostgreSQL**.');
  assertStringIncludes(md, 'Self-provision the database');
  assertStringIncludes(md, '`POSTGRES_URI` or `DATABASE_URL`');
  assert(!md.includes('Aspire orchestration layer provisions it'));
  assert(
    !md.includes('appsettings.json'),
    'no-aspire README must not mention appsettings.json',
  );
});

Deno.test('generateReadme — sqlite gets non-persistent note', () => {
  const md = generateReadme({
    name: 'sqlite-app',
    appName: 'dashboard',
    noAspire: false,
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
    dbEngine: 'mysql',
  });
  assertStringIncludes(md, 'MySQL');
  assertStringIncludes(md, 'Persistent: false');
});
