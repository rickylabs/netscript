/** Auth credential persistence and real POSIX consumer regressions. @module */

import { assert, assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import { MemoryFileSystemAdapter } from '../../../../kernel/adapters/scaffold/memory-fs.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../kernel/application/registries/template-registry.ts';
import { generateRegisterPlugins } from '../../../../kernel/templates/aspire/helpers/register/generate-register-plugins.ts';
import {
  partitionDeclaredEnvironment,
  renderDeclaredEnvironmentLines,
} from '../../../../kernel/templates/aspire/helpers/register/resolve-resource-environment.ts';
import { setAuthProvider, showAuthBackend } from './auth-config.ts';
import { createAuthPluginCommand } from './auth-plugin-command.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

async function sourceEnvironment(path: string, keys: string[]): Promise<Record<string, string>> {
  const child = await new Deno.Command('sh', {
    args: [
      '-c',
      'set -eu; set -a; . "$1"; set +a; shift; exec "$@"',
      'auth-env',
      path,
      Deno.execPath(),
      'eval',
      `--env-file=${path}`,
      'console.log(JSON.stringify(Object.fromEntries(Deno.args.map(key => [key, Deno.env.get(key)]))))',
      ...keys,
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(child.code, 0, new TextDecoder().decode(child.stderr));
  assertEquals(new TextDecoder().decode(child.stderr), '');
  return JSON.parse(new TextDecoder().decode(child.stdout));
}

Deno.test('auth provider reconciliation prunes tracked credentials and keeps one selector', async () => {
  const root = crypto.randomUUID();
  const fs = new MemoryFileSystemAdapter();
  const secret = crypto.randomUUID();
  const marker = crypto.randomUUID();
  const variants = [
    {
      preset: 'github',
      backend: 'kv-oauth',
      clientId: marker,
      clientSecret: secret,
      redirectUri: import.meta.url,
    },
    {
      preset: 'workos',
      backend: 'workos',
      clientId: marker,
      apiKey: secret,
      cookiePassword: secret,
    },
    { preset: 'better-auth', backend: 'better-auth', secret },
  ];
  for (const input of variants) {
    await fs.writeFile(
      join(root, 'appsettings.json'),
      JSON.stringify({
        Application: marker,
        Auth: { Backend: 'kv-oauth', Environment: { NETSCRIPT_AUTH_CLIENT_SECRET: secret } },
        auth: { backend: 'kv-oauth', environment: { WORKOS_API_KEY: secret }, Extra: marker },
        NetScript: {
          Plugins: {
            auth: {
              Workdir: 'auth',
              Entrypoint: 'services/mod.ts',
              Extra: marker,
              Env: { BETTER_AUTH_SECRET: secret, FEATURE: 'enabled' },
              Environment: { NETSCRIPT_AUTH_CLIENT_SECRET: secret },
            },
          },
        },
      }),
    );
    await setAuthProvider({ projectRoot: root, ...input }, fs);
    const tracked = await fs.readFile(join(root, 'appsettings.json'));
    assert(!tracked.includes(secret));
    const config = JSON.parse(tracked);
    assertEquals(config.Auth, undefined);
    assertEquals(config.auth, { Extra: marker });
    assertEquals(config.Application, marker);
    assertEquals(config.NetScript.Plugins.auth.Extra, marker);
    assertEquals(config.NetScript.Plugins.auth.Env, undefined);
    assertEquals(config.NetScript.Plugins.auth.Environment, {
      FEATURE: 'enabled',
      NETSCRIPT_AUTH_BACKEND: input.backend,
    });
    assert((await fs.readFile(join(root, '.env'))).includes(secret));
    const generated = generateRegisterPlugins({
      plugins: config.NetScript.Plugins,
      version: '1.0.0',
      denoDefaults: { Permissions: ['--allow-env'], WatchMode: false },
    });
    assert(!generated.includes(secret));
    await fs.remove(join(root, '.env'));
    assertEquals(await showAuthBackend(root, fs), input.backend);
  }
});

Deno.test({
  name: 'auth hostile literals source into the real Deno environment without execution',
  ignore: Deno.build.os === 'windows',
  async fn() {
    const root = await Deno.makeTempDir();
    try {
      const fs = new MemoryFileSystemAdapter();
      const hostile = crypto.randomUUID() +
        ' # \' " $HOME $(printf injected >&2) `printf injected >&2` \\ \r\nsecond line';
      await setAuthProvider({
        projectRoot: root,
        preset: 'github',
        clientId: hostile,
        clientSecret: hostile,
        redirectUri: import.meta.url,
        kvOAuthKey: hostile,
      }, fs);
      const path = join(root, '.env');
      await Deno.writeTextFile(path, await fs.readFile(path));
      const env = await sourceEnvironment(path, [
        'NETSCRIPT_AUTH_CLIENT_ID',
        'NETSCRIPT_AUTH_CLIENT_SECRET',
        'NETSCRIPT_AUTH_KV_OAUTH_KEY',
        'NETSCRIPT_AUTH_SCOPES',
        'NETSCRIPT_AUTH_BACKEND',
      ]);
      assertEquals(env.NETSCRIPT_AUTH_CLIENT_ID, hostile);
      assertEquals(env.NETSCRIPT_AUTH_CLIENT_SECRET, hostile);
      assertEquals(env.NETSCRIPT_AUTH_KV_OAUTH_KEY, hostile);
      assertEquals(env.NETSCRIPT_AUTH_SCOPES, 'read:user user:email');
      assertEquals(env.NETSCRIPT_AUTH_BACKEND, 'kv-oauth');
      assertEquals(await showAuthBackend(root, fs), 'kv-oauth');
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  },
});

Deno.test('auth quoted multiline updates remove duplicate assignments without orphan content', async () => {
  const root = crypto.randomUUID();
  const fs = new MemoryFileSystemAdapter();
  const old = crypto.randomUUID();
  const next = crypto.randomUUID();
  const input = { projectRoot: root, preset: 'better-auth', secret: `${old}\n${old}'` };
  await setAuthProvider(input, fs);
  const initial = await fs.readFile(join(root, '.env'));
  await fs.writeFile(
    join(root, '.env'),
    `# preserve ' comment\nSAFE=retained\n${initial}${initial}`,
  );
  await setAuthProvider({ ...input, secret: `${next}\n${next}'` }, fs);
  const updated = await fs.readFile(join(root, '.env'));
  assert(!updated.includes(old));
  assert(updated.includes(next));
  assertEquals(updated.match(/^BETTER_AUTH_SECRET=/gm)?.length, 1);
  assertEquals(updated.match(/^NETSCRIPT_AUTH_BACKEND=/gm)?.length, 1);
  assert(updated.startsWith("# preserve ' comment\nSAFE=retained\n"));
});

Deno.test('auth NUL values fail before any persistence', async () => {
  const fs = new MemoryFileSystemAdapter();
  await assertRejects(
    () =>
      setAuthProvider({
        projectRoot: crypto.randomUUID(),
        preset: 'better-auth',
        secret: `${crypto.randomUUID()}\0`,
      }, fs),
    TypeError,
    'NUL',
  );
  assertEquals(fs.getFiles().size, 0);
});

Deno.test('Aspire refused keys cannot escape generated comments through Unicode separators', async () => {
  for (const separator of ['\u2028', '\u2029']) {
    const key = `AUTH_TOKEN${separator}throw Error(1);//`;
    for (const alias of ['Environment', 'Env']) {
      const generated = renderDeclaredEnvironmentLines({ [alias]: { [key]: 'private' } });
      const child = await new Deno.Command(Deno.execPath(), {
        args: ['eval', generated.join('\n')],
      }).output();
      assertEquals(child.code, 0, new TextDecoder().decode(child.stderr));
      assertEquals(generated.join('\n').includes(separator), false);
      assertEquals(generated.join('\n').includes('private'), false);
    }
  }
});

Deno.test('Aspire refuses credential literals for canonical and legacy environment declarations', () => {
  const sensitive = Object.fromEntries(
    [
      'AUTH_SECRET',
      'WORKOS_API_KEY',
      'WORKOS_COOKIE_PASSWORD',
      'NETSCRIPT_AUTH_CLIENT_SECRET',
      'NETSCRIPT_AUTH_KV_OAUTH_KEY',
      'BETTER_AUTH_SECRET',
      'AccessToken',
      'PRIVATE_KEY',
      'AUTH_TOKEN\ncomment',
    ].map((key) => [key, crypto.randomUUID()]),
  );
  for (const alias of ['Environment', 'Env']) {
    const entry = {
      [alias]: {
        ...sensitive,
        NETSCRIPT_AUTH_BACKEND: 'kv-oauth',
        FEATURE: 'enabled',
        PORT: crypto.randomUUID(),
      },
    };
    const partition = partitionDeclaredEnvironment(entry);
    assertEquals(partition.applied, { NETSCRIPT_AUTH_BACKEND: 'kv-oauth', FEATURE: 'enabled' });
    assertEquals(partition.refused, [...Object.keys(sensitive), 'PORT']);
    const generated = renderDeclaredEnvironmentLines(entry).join('\n');
    for (const value of Object.values(sensitive)) assert(!generated.includes(value));
    assert(!generated.includes('AUTH_TOKEN\ncomment'));
    assert(generated.includes('NETSCRIPT_AUTH_BACKEND'));
    assert(generated.includes('FEATURE'));
  }
});

Deno.test('auth CLI reads native environment credentials with flag precedence and no output leak', async () => {
  const keys = [
    'NETSCRIPT_AUTH_CLIENT_SECRET',
    'NETSCRIPT_AUTH_KV_OAUTH_KEY',
    'WORKOS_API_KEY',
    'WORKOS_COOKIE_PASSWORD',
    'BETTER_AUTH_SECRET',
  ];
  const previous = keys.map((key) => Deno.env.get(key));
  const values = keys.map(() => crypto.randomUUID());
  const fs = new MemoryFileSystemAdapter();
  const root = crypto.randomUUID();
  const output: string[] = [];
  let regenerated = 0;
  try {
    keys.forEach((key, index) => Deno.env.set(key, values[index]));
    for (const preset of ['github', 'workos', 'better-auth']) {
      const command = createAuthPluginCommand({
        fs,
        resolveProjectRoot: () => Promise.resolve(root),
        sessions: { list: () => Promise.resolve([]), revoke: (id) => Promise.resolve(id) },
        print: (value) => output.push(value),
        regenerateAspire: () => {
          regenerated++;
          return Promise.resolve();
        },
      });
      await command.parse([
        'provider',
        'set',
        '--preset',
        preset,
        ...preset === 'better-auth' ? [] : ['--client-id', crypto.randomUUID()],
        ...preset === 'github' ? ['--redirect-uri', import.meta.url] : [],
      ]);
    }
    assertEquals(regenerated, 3);
    const persisted = await fs.readFile(join(root, '.env'));
    for (const value of values) assert(persisted.includes(value));
    const explicit = crypto.randomUUID();
    const command = createAuthPluginCommand({
      fs,
      resolveProjectRoot: () => Promise.resolve(root),
      sessions: { list: () => Promise.resolve([]), revoke: (id) => Promise.resolve(id) },
      print: () => {},
    });
    await command.parse(['provider', 'set', '--preset', 'better-auth', '--secret', explicit]);
    const updated = await fs.readFile(join(root, '.env'));
    assert(updated.includes(explicit));
    assert(!updated.includes(values[4]));
    for (const value of values) assert(!output.join('\n').includes(value));
  } finally {
    keys.forEach((key, index) =>
      previous[index] === undefined ? Deno.env.delete(key) : Deno.env.set(key, previous[index]!)
    );
  }
});
