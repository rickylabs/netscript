/** Clean consumer setup shared by the offline regression and opt-in runtime proof. @module */
import { assert, assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { walk } from '@std/fs';
import { fromFileUrl, isAbsolute, join, resolve } from '@std/path';
import { parseAppSettings } from '@netscript/aspire/config';

/** Repository source used by the maintainer CLI, never a published-consumer claim. */
export const REPO = fromFileUrl(new URL('../../../../../', import.meta.url));
/** Background plugins whose install metadata must remain database-free. */
export const BACKGROUND_PLUGINS = ['workers', 'sagas', 'triggers'] as const;

/** Run a bounded acceptance command without leaking its output into public receipts. */
export async function command(
  executable: string,
  args: readonly string[],
  cwd: string,
  env: Record<string, string> = {},
): Promise<string> {
  const result = await new Deno.Command(executable, {
    args: [...args],
    cwd,
    env,
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
    signal: AbortSignal.timeout(300_000),
  }).output();
  const output = new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr);
  if (!result.success) throw new Error(`${executable} ${args[0]} exited ${result.code}\n${output}`);
  return output;
}

/** Execute the real local-source CLI against a consumer. */
export function cli(args: readonly string[], cwd = REPO): Promise<string> {
  return command(
    Deno.execPath(),
    [
      'run',
      '--no-lock',
      '-A',
      join(REPO, 'packages/cli/bin/netscript-dev.ts'),
      ...args,
    ],
    cwd,
    { NETSCRIPT_AUTH_BACKEND: 'kv-oauth' },
  );
}

/** Assert the consumer has no provisioned database or database-dependent plugin process. */
export async function assertNoDatabase(root: string): Promise<void> {
  const { config } = await parseAppSettings(join(root, 'appsettings.json'));
  assertEquals(config.Databases, {});
  for (const name of BACKGROUND_PLUGINS) {
    assertEquals(config.Plugins[`${name}-api`]?.RequiresDb, false, `${name} API`);
    assertEquals(config.BackgroundProcessors[name]?.RequiresDb, false, `${name} background`);
    for (const entry of [config.Plugins[`${name}-api`], config.BackgroundProcessors[name]]) {
      assert(entry);
      if ('Environment' in entry) {
        assertFalse(Object.keys(entry.Environment ?? {}).some(isDatabaseEnvironment));
      }
    }
  }
  assertEquals(config.Plugins.auth?.RequiresDb, false);
  assertEquals(config.Plugins.auth?.Environment?.NETSCRIPT_AUTH_BACKEND, 'kv-oauth');
  // Copied framework source may ship optional adapters; the consumer contributes no SQL schema.
  for (const directory of ['database', 'workers', 'sagas', 'triggers', 'auth']) {
    const path = join(root, directory);
    try {
      for await (const entry of walk(path, { includeDirs: false })) {
        assertFalse(entry.path.endsWith('.prisma'), `Unexpected consumer schema: ${entry.path}`);
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
  for (const helper of ['register-plugins.mts', 'register-background.mts']) {
    const source = await Deno.readTextFile(join(root, 'aspire/.helpers', helper));
    assertFalse(
      /\.withEnvironment\(['"](?:DATABASE_URL|DB_PROVIDER|NETSCRIPT_DB_[^'"]*)['"]/.test(source),
      helper,
    );
    assertFalse(/\.withReference\(databases\./.test(source), helper);
  }
}

/** Database bindings forbidden in a KV-only consumer or detached runner. */
export function isDatabaseEnvironment(name: string): boolean {
  return name === 'DATABASE_URL' || name === 'DB_PROVIDER' ||
    name.startsWith('NETSCRIPT_DB_') ||
    /^(POSTGRES|PGHOST|PGPORT|PGUSER|PGPASSWORD|MYSQL|MSSQL|SQLITE)_?/.test(name);
}

/** Check and lint the actual generated userland, registries and all Aspire helpers. */
export async function checkGenerated(root: string, restoredAspire = false): Promise<void> {
  const files: string[] = [];
  for (
    const directory of [
      'workers',
      'sagas',
      'triggers',
      'auth',
      '.netscript/generated',
      'aspire/.helpers',
    ]
  ) {
    for await (const entry of walk(join(root, directory), { includeDirs: false })) {
      if (/\.(?:ts|mts|tsx)$/.test(entry.path)) files.push(entry.path);
    }
  }
  assert(files.some((file) => file.endsWith('register-background.mts')));
  assert(files.some((file) => file.includes('/.netscript/generated/')));
  // Ordinary Deno CI has no Aspire SDK restore. Lint still covers every helper there;
  // the opt-in proof checks those helpers against the real restored SDK before startup.
  const selection = files.flatMap((file) => ['--file', file]);
  const checkSelection = files.filter((file) => restoredAspire || !file.includes('/aspire/'))
    .flatMap((file) => ['--file', file]);
  const appHostMap = join(root, '.netscript-apphost-check.json');
  if (restoredAspire) {
    // Deno does not inherit the nested AppHost's npm package boundary. Use its declared
    // dependency and real generated SDK source, with Node's .mjs -> .mts resolution.
    const deno = JSON.parse(await Deno.readTextFile(join(root, 'deno.json')));
    const appHost = JSON.parse(await Deno.readTextFile(join(root, 'aspire/package.json')));
    assert(typeof appHost.dependencies['vscode-jsonrpc'] === 'string');
    await Deno.writeTextFile(
      appHostMap,
      JSON.stringify({
        imports: {
          ...deno.imports,
          'vscode-jsonrpc/node.js': `npm:vscode-jsonrpc@${
            appHost.dependencies['vscode-jsonrpc']
          }/node.js`,
        },
      }),
    );
  }
  await command(Deno.execPath(), [
    'run',
    '--allow-read',
    '--allow-run',
    join(REPO, '.llm/tools/run-deno-check.ts'),
    '--cwd',
    root,
    '--deno-arg',
    '--no-lock',
    ...(restoredAspire
      ? [
        '--deno-arg',
        '--unstable-sloppy-imports',
        '--deno-arg',
        '--import-map',
        '--deno-arg',
        appHostMap,
      ]
      : []),
    ...checkSelection,
  ], root);
  await command(Deno.execPath(), [
    'run',
    '--allow-read',
    '--allow-run',
    join(REPO, '.llm/tools/run-deno-lint.ts'),
    '--config',
    join(root, 'deno.json'),
    ...selection,
  ], root);
}

/** Install every background plugin and KV OAuth without SQL, then generate and diagnose. */
export async function scaffoldKvConsumer(parent: string): Promise<string> {
  const destination = resolve(parent);
  await Deno.mkdir(destination, { recursive: true });
  await cli([
    'init',
    'kv-only-consumer',
    '--path',
    destination,
    '--db',
    'none',
    '--cache',
    'false',
    '--app-name',
    'web',
    '--ci',
    '--yes',
    '--no-git',
    '--editor',
    'none',
  ]);
  const root = join(destination, 'kv-only-consumer');
  // Workers and sagas declare streams as a composition dependency, also backed by KV.
  for (const name of ['streams', ...BACKGROUND_PLUGINS, 'auth']) {
    await cli([
      'plugin',
      'install',
      name,
      '--name',
      name,
      '--no-db',
      '--no-samples',
      '--project-root',
      root,
    ]);
  }
  const { config } = await parseAppSettings(join(root, 'appsettings.json'));
  for (const entry of Object.values(config.Plugins)) {
    assert(isAbsolute(entry.Entrypoint), 'Local proof must launch the installed source export');
    assert((await Deno.stat(entry.Entrypoint)).isFile);
  }
  await cli(['generate', 'plugins', '--project-root', root]);
  await cli(['generate', 'runtime-schemas', '--project-root', root]);
  const diagnosis = await cli(['plugin', 'doctor', '--project-root', root]);
  assertStringIncludes(diagnosis, 'Configured module exports manifest');
  assertFalse(diagnosis.includes('\terror\t'), diagnosis);
  await assertNoDatabase(root);
  return root;
}
