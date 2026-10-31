import { assert, assertEquals, assertMatch, assertStringIncludes } from '@std/assert';
import { walk } from '@std/fs';
import { fromFileUrl, join, relative } from '@std/path';
import { APP_TOKEN_FILES } from '@netscript/fresh-ui/token-config';

const root = fromFileUrl(new URL('../../../../../../../', import.meta.url));
const cli = join(root, 'packages/cli/bin/netscript-dev.ts');

async function snapshot(directory: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for await (const entry of walk(directory, { includeDirs: false })) {
    result[relative(directory, entry.path)] = await Deno.readTextFile(entry.path);
  }
  return result;
}

async function runCli(
  app: string,
  args: readonly string[],
  options: { readonly env?: Record<string, string>; readonly forbidden?: string } = {},
): Promise<string> {
  const result = await new Deno.Command(Deno.execPath(), {
    cwd: root,
    args: ['run', '--no-lock', '-A', cli, ...args, '--project-root', app],
    env: {
      ...options.env,
      NO_PROXY: [Deno.env.get('NO_PROXY'), '127.0.0.1', 'localhost'].filter(Boolean).join(','),
      no_proxy: [Deno.env.get('no_proxy'), '127.0.0.1', 'localhost'].filter(Boolean).join(','),
    },
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(result.stdout);
  const stderr = new TextDecoder().decode(result.stderr);
  if (options.forbidden) {
    assert(
      !stdout.includes(options.forbidden) && !stderr.includes(options.forbidden),
      'Registry secret reached command output',
    );
  }
  assertEquals(result.code, 0, `${args.join(' ')}\n${stderr}`);
  return stdout;
}

Deno.test('actual registry commands preserve auth, hashes, read-only diffs and selected style on update', async () => {
  const app = await Deno.makeTempDir({ prefix: 'netscript-s2-cli-acceptance-' });
  const secret = 'fixture-s2-real-command-secret';
  const headers: Array<string | null> = [];
  const item = {
    name: 'x',
    type: 'registry:component',
    files: [{
      path: 'x.tsx',
      type: 'registry:component',
      target: '@ui/x.tsx',
      content: 'export const X = () => null;\n',
    }],
  };
  const styled = {
    ...item,
    name: 'fixture-x',
    files: [{
      ...item.files[0],
      content: 'export const X = () => "fixture style";\n',
    }],
  };
  const items = [item, styled, {
    name: 'fixture-style',
    type: 'registry:style',
    meta: { components: { x: 'fixture-x' } },
  }];
  const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen() {} }, (request) => {
    const header = request.headers.get('Authorization');
    headers.push(header);
    if (header !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 });
    const name = new URL(request.url).pathname.split('/').at(-1)?.replace(/\.json$/, '');
    const payload = name === 'registry'
      ? { name: 'acme', homepage: 'https://registry.example/', items }
      : items.find((candidate) => candidate.name === name);
    return payload ? Response.json(payload) : new Response('Not found', { status: 404 });
  });
  const run = (args: string[]) =>
    runCli(app, args, {
      env: { NETSCRIPT_S2_FIXTURE_TOKEN: secret },
      forbidden: secret,
    });
  try {
    await Deno.writeTextFile(join(app, 'deno.json'), '{"imports":{}}\n');
    const url = `http://127.0.0.1:${server.addr.port}/r/{name}.json`;
    await run([
      'ui:registry',
      'add',
      '@acme',
      url,
      '--header',
      'Authorization=Bearer ${NETSCRIPT_S2_FIXTURE_TOKEN}',
    ]);
    await run(['ui:add', '@acme/x', '--json']);
    const component = join(app, 'components/ui/x.tsx');
    assertEquals(await Deno.readTextFile(component), item.files[0].content);
    const lock = JSON.parse(await Deno.readTextFile(join(app, 'fresh-ui.lock.json')));
    const installed = lock.items['@acme/x'];
    assertEquals(installed.source, url.replace('{name}', 'x'));
    assertMatch(installed.sourceHash, /^[a-f0-9]{64}$/);
    assertEquals(installed.files[0].content, item.files[0].content);
    const expectedHash = new Uint8Array(
      await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(item.files[0].content),
      ),
    ).toHex();
    assertEquals(installed.files[0].hash, expectedHash);
    const installedConfig = await Deno.readTextFile(join(app, 'components.json'));
    assertStringIncludes(installedConfig, '${NETSCRIPT_S2_FIXTURE_TOKEN}');
    assert(!JSON.stringify(await snapshot(app)).includes(secret));
    await Deno.writeTextFile(component, item.files[0].content + '// locally edited\n');
    const before = await snapshot(app);
    const diff = await run(['ui:add', '@acme/x', '--diff', '--json']);
    assertStringIncludes(diff, 'locally edited');
    assertEquals(await snapshot(app), before);
    await Deno.writeTextFile(component, item.files[0].content);
    await run(['ui:add', 'style-utility', '--json']);
    await run(['ui:add', '@acme/fixture-style', '--json']);
    assertEquals(await Deno.readTextFile(component), styled.files[0].content);
    await run(['ui:update']);
    assertEquals(
      JSON.parse(await Deno.readTextFile(join(app, 'components.json'))).style,
      '@acme/fixture-style',
    );
    assertEquals(await Deno.readTextFile(component), styled.files[0].content);
    const updated = JSON.parse(await Deno.readTextFile(join(app, 'fresh-ui.lock.json')));
    assertEquals(updated.items['@acme/x'].source, url.replace('{name}', 'fixture-x'));
    assert(!JSON.stringify(await snapshot(app)).includes(secret));
    assert(headers.length >= 2);
    assert(headers.every((value) => value === `Bearer ${secret}`));
  } finally {
    await server.shutdown();
    await Deno.remove(app, { recursive: true });
  }
});

Deno.test('actual preset init and apply reuse S1, install docs and preserve component copies', async () => {
  const app = await Deno.makeTempDir({ prefix: 'netscript-s2-preset-acceptance-' });
  try {
    await Deno.writeTextFile(join(app, 'deno.json'), '{"imports":{}}\n');
    await Deno.mkdir(join(app, 'routes'));
    await runCli(app, ['ui:init', '--preset', 'studio-utility']);
    for (const name of ['DESIGN.md', 'SKILL.md']) {
      assertEquals(
        await Deno.readTextFile(join(app, '.agents/skills/fresh-ui-theme-studio-utility', name)),
        await Deno.readTextFile(join(root, 'docs/design-system/themes/studio', name)),
      );
    }
    const copies = async () =>
      Object.fromEntries(
        Object.entries(await snapshot(app)).filter(
          ([path]) => /^(components|islands|lib)[\\/]/.test(path),
        ),
      );
    const before = await copies();
    assert(Object.keys(before).length > 0);
    const fonts = await Deno.readTextFile(join(app, 'assets/fonts.json'));
    await runCli(app, ['ui:apply', '--preset', 'tonal', '--only', 'theme', '--json']);
    assertEquals(await copies(), before);
    assertEquals(await Deno.readTextFile(join(app, 'assets/fonts.json')), fonts);
    assertEquals(
      JSON.parse(await Deno.readTextFile(join(app, 'tokens.config.json'))).preset,
      'tonal',
    );
    for (const name of ['DESIGN.md', 'SKILL.md']) {
      assertEquals(
        await Deno.readTextFile(join(app, '.agents/skills/fresh-ui-theme-tonal', name)),
        await Deno.readTextFile(join(root, 'docs/design-system/themes/tonal', name)),
      );
    }
    await runCli(app, ['tokens', 'build']);
    assertEquals(
      JSON.parse(await Deno.readTextFile(join(app, 'assets/theme-preset.json'))).id,
      'tonal',
    );
    assertEquals(await copies(), before);
  } finally {
    await Deno.remove(app, { recursive: true });
  }
});

Deno.test('actual theme removal preserves a legacy app stylesheet and compiled token files', async () => {
  const app = await Deno.makeTempDir({ prefix: 'netscript-s2-theme-removal-' });
  try {
    await Deno.writeTextFile(join(app, 'deno.json'), '{"imports":{}}\n');
    await Deno.mkdir(join(app, 'routes'));
    await Deno.mkdir(join(app, 'assets'));
    const custom = "@import './app.css';\n.app { color: rebeccapurple; }\n";
    await Deno.writeTextFile(join(app, 'assets/styles.css'), custom);
    await Deno.writeTextFile(join(app, 'assets/fonts.json'), '{"appFont":true}\n');
    await runCli(app, ['ui:apply', '--preset', 'tonal', '--only', 'theme']);
    const stylesheet = await Deno.readTextFile(join(app, 'assets/styles.css'));
    const tokens = new Map(
      await Promise.all(
        APP_TOKEN_FILES.map(async (name) =>
          [name, await Deno.readTextFile(join(app, 'assets', name))] as const
        ),
      ),
    );
    const config = await Deno.readTextFile(join(app, 'tokens.config.json'));
    await runCli(app, ['ui:remove', 'theme-tonal']);
    assertEquals(await Deno.readTextFile(join(app, 'assets/styles.css')), stylesheet);
    assertStringIncludes(stylesheet, "@import './app.css';");
    assertStringIncludes(stylesheet, '.app { color: rebeccapurple; }');
    for (const [name, content] of tokens) {
      assertEquals(await Deno.readTextFile(join(app, 'assets', name)), content, name);
    }
    assertEquals(await Deno.readTextFile(join(app, 'tokens.config.json')), config);
    assertEquals(
      JSON.parse(await Deno.readTextFile(join(app, 'fresh-ui.lock.json'))).items['theme-tonal'],
      undefined,
    );
  } finally {
    await Deno.remove(app, { recursive: true });
  }
});
