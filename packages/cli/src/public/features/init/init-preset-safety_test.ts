import { assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join } from '@std/path';

Deno.test('init rejects bad preset URLs and schemas before creating any scaffold files', async (test) => {
  const repository = fromFileUrl(new URL('../../../../../../', import.meta.url));
  const parent = join(repository, '.llm/tmp', `preset-safety-${crypto.randomUUID()}`);
  const server = Deno.serve(
    { hostname: '127.0.0.1', port: 0, onListen: () => {} },
    (request) =>
      new URL(request.url).pathname === '/preset.json'
        ? Response.json({ version: 2, theme: 'studio-utility' })
        : Response.json({ name: 'invalid-theme', type: 'registry:theme', cssVars: 'invalid' }),
  );
  try {
    await Deno.mkdir(parent, { recursive: true });
    for (const binary of ['netscript.ts', 'netscript-dev.ts']) {
      for (
        const [name, preset, diagnostic] of [
          ['bad-url', 'https://', 'Invalid UI preset URL'],
          [
            'bad-preset-schema',
            `http://127.0.0.1:${server.addr.port}/preset.json`,
            'Invalid UI preset',
          ],
          ['bad-theme-schema', `http://127.0.0.1:${server.addr.port}/theme.json`, 'registry'],
        ]
      ) {
        await test.step(`${binary}: ${name}`, async () => {
          const target = join(parent, binary, name);
          const result = await new Deno.Command(Deno.execPath(), {
            args: [
              'run',
              '--frozen',
              '--unstable-kv',
              '-A',
              join(repository, 'packages/cli/bin', binary),
              'init',
              name,
              '--path',
              join(parent, binary),
              '--db',
              'none',
              '--editor',
              'none',
              '--ci',
              '--yes',
              '--no-git',
              '--no-aspire',
              '--preset',
              preset,
            ],
            cwd: repository,
            stdin: 'null',
            stdout: 'piped',
            stderr: 'piped',
          }).output();
          const output = new TextDecoder().decode(result.stdout) +
            new TextDecoder().decode(result.stderr);
          assertEquals(result.code, 1, output.slice(-4000));
          let entries: string[] = [];
          try {
            entries = [...Deno.readDirSync(target)].map((entry) => entry.name);
          } catch (error) {
            if (!(error instanceof Deno.errors.NotFound)) throw error;
          }
          assertEquals(entries, [], 'Invalid preset must leave zero scaffolded files');
          assertStringIncludes(output, diagnostic);
        });
      }
    }
  } finally {
    await server.shutdown();
    await Deno.remove(parent, { recursive: true });
  }
});
