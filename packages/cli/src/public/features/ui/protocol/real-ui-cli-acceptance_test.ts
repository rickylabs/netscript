import { assert, assertEquals, assertMatch, assertStringIncludes } from '@std/assert';
import { walk } from '@std/fs';
import { fromFileUrl, join, relative } from '@std/path';

const root = fromFileUrl(new URL('../../../../../../../', import.meta.url));
const cli = join(root, 'packages/cli/bin/netscript-dev.ts');

async function snapshot(directory: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for await (const entry of walk(directory, { includeDirs: false })) {
    result[relative(directory, entry.path)] = await Deno.readTextFile(entry.path);
  }
  return result;
}

Deno.test('actual ui:add sends environment auth, records hashes and diff is read-only', async () => {
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
  const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen() {} }, (request) => {
    const header = request.headers.get('Authorization');
    headers.push(header);
    if (header !== `Bearer ${secret}`) return new Response('Unauthorized', { status: 401 });
    return Response.json(
      new URL(request.url).pathname.endsWith('/registry.json')
        ? { name: 'acme', homepage: 'https://registry.example/', items: [item] }
        : item,
    );
  });
  async function run(args: string[]): Promise<string> {
    const result = await new Deno.Command(Deno.execPath(), {
      cwd: root,
      args: ['run', '--no-lock', '-A', cli, ...args, '--project-root', app],
      env: {
        NETSCRIPT_S2_FIXTURE_TOKEN: secret,
        NO_PROXY: [Deno.env.get('NO_PROXY'), '127.0.0.1', 'localhost'].filter(Boolean).join(','),
        no_proxy: [Deno.env.get('no_proxy'), '127.0.0.1', 'localhost'].filter(Boolean).join(','),
      },
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const stdout = new TextDecoder().decode(result.stdout);
    const stderr = new TextDecoder().decode(result.stderr);
    assert(
      !stdout.includes(secret) && !stderr.includes(secret),
      'Registry secret reached command output',
    );
    assertEquals(result.code, 0, stderr);
    return stdout;
  }
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
    assert(headers.length >= 2);
    assert(headers.every((value) => value === `Bearer ${secret}`));
  } finally {
    await server.shutdown();
    await Deno.remove(app, { recursive: true });
  }
});
