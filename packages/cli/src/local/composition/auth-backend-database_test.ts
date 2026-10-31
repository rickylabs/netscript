/** Consumer proof for backend-selected auth persistence; never starts runtime resources. */
import { assert, assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { walk } from '@std/fs';
import { fromFileUrl, join } from '@std/path';

const REPO = fromFileUrl(new URL('../../../../../', import.meta.url));
const CLI = join(REPO, 'packages/cli/bin/netscript-dev.ts');
const PUBLIC_CLI = join(REPO, 'packages/cli/bin/netscript.ts');
const AUTH_TABLES = ['auth_users', 'auth_sessions', 'auth_accounts', 'auth_verifications'];

async function run(
  args: readonly string[],
  options: { readonly backend?: string; readonly public?: boolean } = {},
): Promise<string> {
  const result = await new Deno.Command(Deno.execPath(), {
    args: ['run', '--no-lock', '-A', options.public ? PUBLIC_CLI : CLI, ...args],
    cwd: REPO,
    env: options.backend ? { NETSCRIPT_AUTH_BACKEND: options.backend } : {},
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const output = new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr);
  assertEquals(result.code, 0, output);
  return output;
}

async function withProject(
  probe: (root: string) => Promise<void>,
  options: { readonly public?: boolean } = {},
): Promise<void> {
  const scratch = join(REPO, '.llm/tmp', `auth-database-${crypto.randomUUID()}`);
  await Deno.mkdir(scratch, { recursive: true });
  try {
    await run([
      'init',
      'auth-proof',
      '--path',
      scratch,
      '--db',
      'none',
      '--app-name',
      'web',
      '--ci',
      '--yes',
      '--no-git',
      '--editor',
      'none',
    ], options);
    await probe(join(scratch, 'auth-proof'));
  } finally {
    await Deno.remove(scratch, { recursive: true });
  }
}

async function settings(root: string) {
  return JSON.parse(await Deno.readTextFile(join(root, 'appsettings.json'))).NetScript;
}

async function prismaFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  for await (
    const entry of walk(root, {
      includeDirs: false,
      skip: [/node_modules/, /\/packages\//],
    })
  ) {
    if (entry.path.endsWith('.prisma')) files.push(entry.path);
  }
  return files;
}

async function assertKvInstall(root: string): Promise<void> {
  const config = await settings(root);
  assertEquals(config.Databases, {});
  assertEquals(config.Plugins.auth.RequiresDb, false);
  assertEquals(config.Plugins.auth.Environment.NETSCRIPT_AUTH_BACKEND, 'kv-oauth');
  assertEquals(await prismaFiles(root), []);
  const metadata = JSON.parse(await Deno.readTextFile(join(root, 'auth/scaffold.plugin.json')));
  assertEquals(metadata.capabilities.hasDatabaseMigrations, false);
  assertEquals(metadata.provider.defaultRequiresDb, false);
  assertEquals(metadata.provider.infrastructureRequires, ['kv']);
  assertEquals(metadata.officialSource.requiresDb, false);
  await run(['generate', 'plugins', '--project-root', root]);
  await run(['generate', 'runtime-schemas', '--project-root', root]);
  const diagnosis = await run(['plugin', 'doctor', '--project-root', root]);
  assertStringIncludes(diagnosis, 'Configured module exports manifest');
  assertFalse(diagnosis.includes('\terror\t'), diagnosis);
  assertEquals(await prismaFiles(root), []);
}

Deno.test('kv-oauth installs on a DB-free consumer and generate/doctor stay clean', async () => {
  await withProject(async (root) => {
    await run(['plugin', 'install', 'auth', '--name', 'auth', '--project-root', root], {
      backend: 'kv-oauth',
    });
    await assertKvInstall(root);
  });
});

Deno.test('public auth install with --no-db uses the selected KV backend', async () => {
  await withProject(async (root) => {
    await run([
      'plugin',
      'install',
      'auth',
      '--name',
      'auth',
      '--project-root',
      root,
      '--no-db',
      '--local-path',
      join(REPO, 'plugins/auth'),
    ], { backend: 'kv-oauth', public: true });
    // Public install retains its exact published package alias.
    const denoPath = join(root, 'deno.json');
    const config = JSON.parse(await Deno.readTextFile(denoPath));
    assertStringIncludes(config.imports['@netscript/plugin-auth'], 'jsr:@netscript/plugin-auth@');
    await assertKvInstall(root);
  }, { public: true });
});

Deno.test('better-auth preserves four tables and switching to KV adds no schema or DB requirement', async () => {
  await withProject(async (root) => {
    await Deno.writeTextFile(join(root, '.env'), "NETSCRIPT_AUTH_BACKEND='better-auth'\n");
    await run(['plugin', 'install', 'auth', '--name', 'auth', '--project-root', root]);
    const sqlConfig = await settings(root);
    assertEquals(sqlConfig.Plugins.auth.RequiresDb, true);
    assertEquals(sqlConfig.Plugins.auth.Environment.NETSCRIPT_AUTH_BACKEND, 'better-auth');
    assertEquals(Object.keys(sqlConfig.Databases), ['postgres']);
    const fragments = await prismaFiles(root);
    const authSchema = fragments.find((path) => path.endsWith('/auth/auth.prisma'));
    assert(authSchema !== undefined);
    const before = await Deno.readTextFile(authSchema);
    for (const table of AUTH_TABLES) assertStringIncludes(before, `@@map("${table}")`);

    await run(['plugin', 'install', 'auth', '--name', 'auth', '--project-root', root, '--force'], {
      backend: 'kv-oauth',
    });
    const kvConfig = await settings(root);
    assertEquals(kvConfig.Plugins.auth.RequiresDb, false);
    assertEquals(kvConfig.Plugins.auth.Environment.NETSCRIPT_AUTH_BACKEND, 'kv-oauth');
    assertEquals(kvConfig.Databases, sqlConfig.Databases);
    assertEquals(await Deno.readTextFile(authSchema), before);

    // An existing SQL app must not gain auth tables for KV. Remove only the proven test-owned
    // auth fragment and reinstall once more to prove it is not re-contributed.
    await Deno.remove(authSchema);
    await run(['plugin', 'install', 'auth', '--name', 'auth', '--project-root', root, '--force'], {
      backend: 'kv-oauth',
    });
    assertFalse((await prismaFiles(root)).some((path) => path.endsWith('/auth/auth.prisma')));
    await run(['generate', 'plugins', '--project-root', root]);
    await run(['generate', 'runtime-schemas', '--project-root', root]);
  });
});
