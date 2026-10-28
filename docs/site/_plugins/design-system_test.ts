import { fileURLToPath } from 'node:url';

/** Root CI discovers this bridge; the renderer fixture needs the standalone site's import map. */
Deno.test('design system renders the complete fixture and canonical corpus', async () => {
  const siteRoot = new URL('../', import.meta.url);
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      'test',
      '--no-lock',
      '--config',
      fileURLToPath(new URL('deno.json', siteRoot)),
      '--allow-read',
      fileURLToPath(new URL('./design-system/renderer-fixture.ts', import.meta.url)),
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
