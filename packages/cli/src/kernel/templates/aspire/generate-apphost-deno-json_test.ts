/**
 * @module templates/aspire/generate-apphost-deno-json_test
 */

import { assert, assertEquals, assertThrows } from 'jsr:@std/assert@^1';
import { fromFileUrl, join } from '@std/path';
import { JSR_SPECIFIERS } from '../../constants/jsr-specifiers.ts';
import { SCAFFOLD_VERSIONS } from '../../constants/scaffold/scaffold-versions.ts';
import { SCAFFOLD_WORKSPACE_CATALOG } from '../../constants/scaffold/scaffold-app-catalog.ts';
import { generateAppHostDenoJson, reconcileAppHostDenoJson } from './generate-apphost-deno-json.ts';

const REPO_ROOT = fromFileUrl(new URL('../../../../../../', import.meta.url));

Deno.test('generateAppHostDenoJson emits imports-only config across all 3 scaffold modes and DB engines', () => {
  // Mode 1: local workspace members (`./packages/aspire` inherited from root workspace)
  const localMembersPg = JSON.parse(
    generateAppHostDenoJson({
      dbEngines: ['postgres'],
      importMode: 'local',
      packagesAsWorkspaceMembers: true,
    }),
  );
  assertEquals(Object.keys(localMembersPg), ['imports']);
  assertEquals(localMembersPg.imports, {
    net: 'node:net',
    'vscode-jsonrpc/node.js': 'npm:vscode-jsonrpc@8.2.0/node.js',
    zod: 'catalog:',
    pg: `npm:pg@${SCAFFOLD_VERSIONS.APPHOST_PG}`,
  });

  const localMembersSqlite = JSON.parse(
    generateAppHostDenoJson({
      dbEngines: ['sqlite'],
      importMode: 'local',
      packagesAsWorkspaceMembers: true,
    }),
  );
  assert(!('pg' in localMembersSqlite.imports));
  assert(!('@netscript/aspire' in localMembersSqlite.imports));

  // Mode 2: external local source (`packagesAsWorkspaceMembers: false`)
  const externalLocalPg = JSON.parse(
    generateAppHostDenoJson({
      dbEngines: ['postgres'],
      importMode: 'local',
      localBase: '../..',
      packagesAsWorkspaceMembers: false,
    }),
  );
  assertEquals(Object.keys(externalLocalPg), ['imports']);
  assertEquals(externalLocalPg.imports, {
    net: 'node:net',
    'vscode-jsonrpc/node.js': 'npm:vscode-jsonrpc@8.2.0/node.js',
    zod: 'catalog:',
    pg: `npm:pg@${SCAFFOLD_VERSIONS.APPHOST_PG}`,
    '@netscript/aspire': '../../../packages/aspire/mod.ts',
    '@netscript/aspire/config': '../../../packages/aspire/config.ts',
    '@netscript/aspire/constants': '../../../packages/aspire/constants.ts',
    '@netscript/aspire/types': '../../../packages/aspire/types.ts',
    '@netscript/aspire/application': '../../../packages/aspire/src/application/mod.ts',
  });

  const externalLocalSqlite = JSON.parse(
    generateAppHostDenoJson({
      dbEngines: ['sqlite'],
      importMode: 'local',
      localBase: '../..',
      packagesAsWorkspaceMembers: false,
    }),
  );
  assert(!('pg' in externalLocalSqlite.imports));
  assertEquals(
    externalLocalSqlite.imports['@netscript/aspire/application'],
    '../../../packages/aspire/src/application/mod.ts',
  );

  // Mode 3: JSR mode
  const jsrPg = JSON.parse(
    generateAppHostDenoJson({
      dbEngines: ['postgres'],
      importMode: 'jsr',
    }),
  );
  assertEquals(Object.keys(jsrPg), ['imports']);
  assertEquals(jsrPg.imports, {
    net: 'node:net',
    'vscode-jsonrpc/node.js': 'npm:vscode-jsonrpc@8.2.0/node.js',
    zod: 'catalog:',
    pg: `npm:pg@${SCAFFOLD_VERSIONS.APPHOST_PG}`,
    '@netscript/aspire': JSR_SPECIFIERS.aspire,
  });

  const jsrSqlite = JSON.parse(
    generateAppHostDenoJson({
      dbEngines: ['sqlite'],
      importMode: 'jsr',
    }),
  );
  assert(!('pg' in jsrSqlite.imports));
  assertEquals(jsrSqlite.imports['@netscript/aspire'], JSR_SPECIFIERS.aspire);
});

Deno.test('reconcileAppHostDenoJson adds pg when needed, preserves user entries, and is idempotent', () => {
  const existing = JSON.stringify(
    {
      imports: {
        'vscode-jsonrpc/node.js': 'npm:vscode-jsonrpc@8.2.0/node.js',
        custom: 'npm:custom@1.0.0',
      },
    },
    null,
    2,
  );
  assertEquals(reconcileAppHostDenoJson(existing, ['sqlite']), null);

  const updated = reconcileAppHostDenoJson(existing, ['sqlite', 'postgres']);
  assert(updated !== null);
  const parsed = JSON.parse(updated);
  assertEquals(parsed.imports, {
    'vscode-jsonrpc/node.js': 'npm:vscode-jsonrpc@8.2.0/node.js',
    custom: 'npm:custom@1.0.0',
    pg: `npm:pg@${SCAFFOLD_VERSIONS.APPHOST_PG}`,
  });

  // Idempotent on second pass and never removes declared pg when engines change.
  assertEquals(reconcileAppHostDenoJson(updated, ['postgres']), null);
  assertEquals(reconcileAppHostDenoJson(updated, []), null);
  assertThrows(() => reconcileAppHostDenoJson('[]', ['postgres']), TypeError);
});

Deno.test('consumer subpath imports for @netscript/aspire compile in both local workspace-member and external-local shapes', async () => {
  // Verify the JSR package manifest declares every subpath the AppHost consumes.
  const aspirePkg = JSON.parse(
    await Deno.readTextFile(join(REPO_ROOT, 'packages/aspire/deno.json')),
  ) as { exports: Record<string, string> };
  for (const subpath of ['.', './config', './constants', './types', './application']) {
    assert(subpath in aspirePkg.exports, `packages/aspire/deno.json missing export ${subpath}`);
  }

  const consumerSource = `import type { NetScriptConfig } from '@netscript/aspire/types';
import { parseAppSettings } from '@netscript/aspire/config';
import { OTEL_ENV_VARS, RESOURCE_DEFAULTS } from '@netscript/aspire/constants';
import { composeAppHost } from '@netscript/aspire/application';
import * as aspireRoot from '@netscript/aspire';

export function verify(config: NetScriptConfig): string {
  return String(typeof parseAppSettings) + String(typeof composeAppHost) +
    String(typeof aspireRoot) + OTEL_ENV_VARS.OTEL_SERVICE_NAME +
    RESOURCE_DEFAULTS.HttpEndpointName + config.Name;
}
`;

  // Shape A: external-local (`packagesAsWorkspaceMembers: false`)
  const externalRoot = await Deno.makeTempDir({ prefix: 'apphost-subpath-external-' });
  try {
    await Deno.mkdir(join(externalRoot, 'aspire/.helpers'), { recursive: true });
    await Deno.writeTextFile(
      join(externalRoot, 'deno.json'),
      JSON.stringify({
        workspace: ['./aspire'],
        catalog: SCAFFOLD_WORKSPACE_CATALOG,
        unstable: ['raw-imports', 'kv', 'sloppy-imports'],
      }),
    );
    await Deno.writeTextFile(
      join(externalRoot, 'aspire/deno.json'),
      generateAppHostDenoJson({
        dbEngines: ['sqlite'],
        importMode: 'local',
        localBase: REPO_ROOT,
        packagesAsWorkspaceMembers: false,
      }),
    );
    await Deno.writeTextFile(join(externalRoot, 'aspire/.helpers/consumer.mts'), consumerSource);

    const out = await new Deno.Command(Deno.execPath(), {
      args: [
        'check',
        '--no-lock',
        '--unstable-kv',
        '--config',
        'aspire/deno.json',
        'aspire/.helpers/consumer.mts',
      ],
      cwd: externalRoot,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const stderr = new TextDecoder().decode(out.stderr);
    assertEquals(out.code, 0, stderr);
  } finally {
    await Deno.remove(externalRoot, { recursive: true });
  }

  // Shape B: local workspace members (`packagesAsWorkspaceMembers: true` with copied packages/aspire)
  const memberRoot = await Deno.makeTempDir({ prefix: 'apphost-subpath-member-' });
  try {
    await Deno.mkdir(join(memberRoot, 'aspire/.helpers'), { recursive: true });
    await Deno.mkdir(join(memberRoot, 'packages'), { recursive: true });
    await Deno.symlink(join(REPO_ROOT, 'packages/aspire'), join(memberRoot, 'packages/aspire'));
    await Deno.writeTextFile(
      join(memberRoot, 'deno.json'),
      JSON.stringify({
        workspace: ['./aspire', './packages/aspire'],
        catalog: SCAFFOLD_WORKSPACE_CATALOG,
        unstable: ['raw-imports', 'kv', 'sloppy-imports'],
      }),
    );
    await Deno.writeTextFile(
      join(memberRoot, 'aspire/deno.json'),
      generateAppHostDenoJson({
        dbEngines: ['sqlite'],
        importMode: 'local',
        packagesAsWorkspaceMembers: true,
      }),
    );
    await Deno.writeTextFile(join(memberRoot, 'aspire/.helpers/consumer.mts'), consumerSource);

    const out = await new Deno.Command(Deno.execPath(), {
      args: [
        'check',
        '--no-lock',
        '--unstable-kv',
        '--config',
        'aspire/deno.json',
        'aspire/.helpers/consumer.mts',
      ],
      cwd: memberRoot,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const stderr = new TextDecoder().decode(out.stderr);
    assertEquals(out.code, 0, stderr);
  } finally {
    await Deno.remove(memberRoot, { recursive: true });
  }
});
