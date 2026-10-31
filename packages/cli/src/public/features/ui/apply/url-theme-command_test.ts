import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join } from '@std/path';
import { themeItem } from '../../../../../../../tools/figma-plugin/src/theme-item.ts';
import { collections } from '../../../../../../fresh-ui/src/tokens/assets/figma.generated.ts';
import { modifiedFixture } from '../../../../../../../tools/figma-plugin/tests/mock-figma.ts';

Deno.test('one-command fresh scaffold installs the changed Figma URL theme and passes deno task check', async () => {
  const cli = fromFileUrl(new URL('../../../../../bin/netscript-dev.ts', import.meta.url));
  const repository = fromFileUrl(new URL('../../../../../../../', import.meta.url));
  const parent = join(repository, '.llm/tmp', `figma-theme-proof-${crypto.randomUUID()}`);
  const project = join(parent, 'theme-proof');
  const app = join(project, 'apps/dashboard');
  const payload = JSON.stringify(themeItem(modifiedFixture(collections), 'studio-utility'));
  const server = Deno.serve(
    { hostname: '127.0.0.1', port: 0, onListen: () => {} },
    (request) =>
      new URL(request.url).pathname === '/bad.json'
        ? Response.json({})
        : new Response(payload, { headers: { 'Content-Type': 'application/json' } }),
  );
  const url = `http://127.0.0.1:${server.addr.port}/theme.json`;
  const run = async (args: string[], cwd = repository, expected = 0) => {
    const result = await new Deno.Command(Deno.execPath(), {
      args,
      cwd,
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const text = new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr);
    assertEquals(result.code, expected, text.slice(-16000));
    return text;
  };
  const command = ['run', '--frozen', '--unstable-kv', '-A', cli];
  try {
    await Deno.mkdir(parent, { recursive: true });
    await run([
      ...command,
      'init',
      'theme-proof',
      '--path',
      parent,
      '--app-name',
      'dashboard',
      '--db',
      'none',
      '--editor',
      'none',
      '--ci',
      '--yes',
      '--no-git',
      '--no-aspire',
      '--preset',
      url,
    ]);
    assertEquals(
      JSON.parse(await Deno.readTextFile(join(app, 'tokens.config.json'))).sourceRoot,
      'tokens/source',
    );
    assertStringIncludes(await Deno.readTextFile(join(app, 'assets/tokens.css')), '#223344');
    assert(
      (await Deno.stat(join(app, '.agents/skills/fresh-ui-theme-studio-utility/DESIGN.md'))).isFile,
    );
    await run([...command, 'ui:apply', '--project-root', app, '--preset', url]);
    const css = await Deno.readTextFile(join(app, 'assets/tokens.css'));
    await run([...command, 'tokens', 'build', '--project-root', app]);
    assertEquals(await Deno.readTextFile(join(app, 'assets/tokens.css')), css);
    await run(['task', 'check'], project);
    const lock = await Deno.readTextFile(join(app, 'fresh-ui.lock.json'));
    const error = await run(
      [
        ...command,
        'ui:apply',
        '--project-root',
        app,
        '--preset',
        `http://127.0.0.1:${server.addr.port}/bad.json`,
      ],
      repository,
      1,
    );
    assertStringIncludes(error, 'registry');
    assertEquals(await Deno.readTextFile(join(app, 'fresh-ui.lock.json')), lock);
    assertEquals(await Deno.readTextFile(join(app, 'assets/tokens.css')), css);
  } finally {
    await server.shutdown();
    await Deno.remove(parent, { recursive: true }).catch((error) => {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    });
  }
});
