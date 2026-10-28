import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join } from '@std/path';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';

Deno.test('native registry CLI installs namespaced sources with env auth, diffs safely and reconciles updates/removal', async () => {
  const root = await Deno.makeTempDir();
  const fs = new DenoFileSystem();
  await fs.writeFile(join(root, 'deno.json'), '{"imports":{}}\n');
  await fs.createDir(join(root, 'routes'));
  const credential = crypto.randomUUID();
  const environment = 'NETSCRIPT_REGISTRY_FIXTURE_TOKEN';
  const output: string[] = [];
  const requested: string[] = [];
  let version = 1;
  const payload = (name: string) =>
    name === 'helper'
      ? {
        name,
        type: 'registry:lib',
        description: 'Shared fixture helper',
        dependencies: ['npm:clsx@^2.1.1'],
        files: [{
          path: 'registry/lib/helper.ts',
          type: 'registry:lib',
          target: '@lib/helper.ts',
          content: 'export const helper = 1;\n',
        }],
      }
      : {
        name,
        type: name === 'bad' ? 'invalid' : 'registry:ui',
        description: 'Fixture component',
        registryDependencies: ['helper'],
        docs: 'Use the fixture x component.',
        categories: ['fixture'],
        cssVars: { light: { fixture: 'rebeccapurple' } },
        css: { '.fixture': { color: 'var(--fixture)' } },
        files: [{
          path: 'registry/ui/x.ts',
          type: 'registry:ui',
          target: '@ui/x.ts',
          content:
            `import { helper } from '../lib/helper.ts';\nexport const x = helper + ${version};\n`,
        }],
      };
  const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen: () => {} }, (request) => {
    assertEquals(request.headers.get('Authorization'), `Bearer ${credential}`);
    const name = new URL(request.url).pathname.split('/').pop()!.replace(/\.json$/, '');
    requested.push(name);
    if (name === 'denied') return new Response(credential, { status: 403 });
    return Response.json(
      name === 'registry'
        ? {
          name: 'acme',
          homepage: 'https://example.com',
          items: [payload('x'), payload('helper')],
        }
        : payload(name),
    );
  });
  const cli = fromFileUrl(new URL('../../../../../bin/netscript-dev.ts', import.meta.url));
  const run = async (
    command: string,
    args: string[],
    expectedSuccess = true,
    app = true,
  ): Promise<string> => {
    const result = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--frozen',
        '--unstable-kv',
        '-A',
        cli,
        command,
        ...args,
        ...(app ? ['--project-root', root] : []),
      ],
      env: { [environment]: credential },
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const stdout = new TextDecoder().decode(result.stdout);
    const stderr = new TextDecoder().decode(result.stderr);
    output.push(stdout, stderr);
    assert(
      !stdout.includes(credential) && !stderr.includes(credential),
      'Credentials must not appear in output',
    );
    if (expectedSuccess) assertEquals(result.code, 0, stderr);
    else assert(result.code !== 0, 'Negative control must fail');
    return stdout;
  };
  const snapshot = async () => {
    const files: Record<string, string> = {};
    for await (const entry of fs.walk(root)) {
      if (entry.isFile) files[entry.path] = await fs.readFile(entry.path);
    }
    return files;
  };
  try {
    await run('ui:registry', [
      'add',
      '@acme',
      `http://127.0.0.1:${server.addr.port}/r/{name}.json`,
      '--header',
      'Authorization=Bearer ${' + environment + '}',
    ]);
    const config = JSON.parse(await fs.readFile(join(root, 'components.json')));
    config.aliases.ui = 'client/widgets';
    config.aliases.lib = 'client/runtime';
    await fs.writeFile(join(root, 'components.json'), JSON.stringify(config));
    await run('ui:add', ['@acme/x']);
    const target = join(root, 'client/widgets/x.ts');
    const original = await fs.readFile(target);
    assertStringIncludes(original, "from '../runtime/helper.ts'");
    const lock = JSON.parse(await fs.readFile(join(root, 'fresh-ui.lock.json')));
    assert(
      lock.items['@acme/x'].files.some((file: { target: string }) =>
        file.target === 'client/widgets/x.ts'
      ),
    );
    assertStringIncludes(await fs.readFile(join(root, 'assets/styles.css')), '@import');
    const compile = await new Deno.Command(Deno.execPath(), {
      args: ['check', '--no-lock', '--unstable-kv', target],
      cwd: root,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(compile.code, 0, new TextDecoder().decode(compile.stderr));
    await fs.writeFile(target, original + '// local edit\n');
    version = 2;
    const beforeDiff = await snapshot();
    const differences = JSON.parse(await run('ui:add', ['@acme/x', '--diff', '--json']));
    assert(
      differences.diffs.some((diff: { path: string; localEdited: boolean; localDiff: string }) =>
        diff.path === 'client/widgets/x.ts' && diff.localEdited &&
        diff.localDiff.includes('// local edit')
      ),
    );
    assertEquals(await snapshot(), beforeDiff);
    await run('ui:update', ['@acme/x']);
    assertEquals(await fs.readFile(target), original + '// local edit\n');
    await fs.writeFile(target, original);
    await run('ui:update', ['@acme/x']);
    assertStringIncludes(await fs.readFile(target), 'helper + 2');
    const beforeQueries = await snapshot();
    assert(
      JSON.parse(await run('ui:list', ['--registry', '@acme', '--json'])).items.some((
        item: { name: string; installed: boolean },
      ) => item.name === 'x' && item.installed),
    );
    assertEquals(
      JSON.parse(await run('ui:search', ['fixture component', '--registry', '@acme', '--json']))
        .items.length,
      1,
    );
    assertStringIncludes(
      JSON.parse(await run('ui:view', ['@acme/x', '--json'])).files[0].content,
      'helper + 2',
    );
    assertStringIncludes(JSON.parse(await run('ui:docs', ['@acme/x', '--json'])).docs, 'fixture x');
    const info = JSON.parse(await run('ui:info', ['--json']));
    assertEquals(info.registries, ['@acme']);
    assert(!JSON.stringify(info).includes('Authorization'));
    await run('ui:registry', ['validate', '@acme', '--json']);
    await run('ui:registry', ['validate', '@acme/bad'], false);
    await run('ui:view', ['@acme/denied'], false);
    assertEquals(await snapshot(), beforeQueries);
    const url = (await run(
      'ui:preset',
      ['url', '--theme', 'studio-utility', '--style', 'style-utility'],
      true,
      false,
    )).trim();
    assertEquals(
      JSON.parse(await run('ui:preset', ['decode', url], true, false)).theme,
      'studio-utility',
    );
    await run('ui:remove', ['@acme/helper'], false);
    await run('ui:remove', ['@acme/x']);
    assertEquals(await fs.exists(target), false);
    const fetchedX = requested.filter((name) => name === 'x').length;
    await run('ui:update', []);
    assertEquals(requested.filter((name) => name === 'x').length, fetchedX);
    assertEquals(await fs.exists(target), false);
    await run('ui:remove', ['@acme/helper']);
    const beforeEmptyUpdate = await snapshot();
    await run('ui:update', []);
    assertEquals(await snapshot(), beforeEmptyUpdate);
    assertEquals(JSON.parse(await fs.readFile(join(root, 'fresh-ui.lock.json'))).items, {});
    assert(!output.join('\n').includes(credential));
  } finally {
    await server.shutdown();
    await Deno.remove(root, { recursive: true });
  }
});
