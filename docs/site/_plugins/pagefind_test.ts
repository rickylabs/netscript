import { fileURLToPath } from 'node:url';

/** Root test discovery delegates native indexing to the site's frozen import map. */
Deno.test('Pagefind preserves every native output byte under shuffled ingestion', async () => {
  const siteRoot = new URL('../', import.meta.url);
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      'test',
      '--frozen',
      '--config',
      fileURLToPath(new URL('deno.json', siteRoot)),
      '--allow-all',
      fileURLToPath(new URL('./pagefind-fixture.ts', import.meta.url)),
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
