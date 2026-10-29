import { fileURLToPath } from 'node:url';

/** Root CI discovers this bridge; the fixture needs the standalone site's import map. */
Deno.test('scenario picker renders all panels through the site', async () => {
  const siteRoot = new URL('../', import.meta.url);
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      'test',
      '--no-lock',
      '--config',
      fileURLToPath(new URL('deno.json', siteRoot)),
      '--allow-read',
      fileURLToPath(new URL('./scenario-picker-fixture.ts', import.meta.url)),
    ],
    cwd: siteRoot,
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!output.success) {
    throw new Error(
      new TextDecoder().decode(output.stderr) + new TextDecoder().decode(output.stdout),
    );
  }
});
