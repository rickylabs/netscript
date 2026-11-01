import { fileURLToPath } from 'node:url';

/** Run the renderer with the site's import map and reviewed lock, also from root CI. */
Deno.test('design system renders the complete fixture and canonical corpus', async () => {
  const siteRoot = new URL('../', import.meta.url);
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      'test',
      '--frozen',
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
