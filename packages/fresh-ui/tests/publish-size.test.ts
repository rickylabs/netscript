import { assert, assertEquals } from '@std/assert';

// Budget the actual uncompressed publish file set, not a directory approximation or tar size.
const PUBLISH_BUDGET_BYTES = 5_000_000;

Deno.test('fresh-ui native publish file set stays below five MB', async () => {
  const root = new URL('../', import.meta.url);
  const result = await new Deno.Command(Deno.execPath(), {
    args: ['publish', '--dry-run', '--allow-dirty'],
    cwd: root,
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
    env: { NO_COLOR: '1' },
  }).output();
  const output = new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr);
  assertEquals(result.code, 0, output);
  const files = [...output.matchAll(/^\s+(file:\/\/.+) \([^\n]+\)$/gm)].map((match) => match[1]);
  assert(files.length > 0, 'Native publish output must enumerate files');
  const bytes = (await Promise.all(files.map(async (url) => (await Deno.stat(new URL(url))).size)))
    .reduce((sum, size) => sum + size, 0);
  console.log(
    JSON.stringify({
      package: '@netscript/fresh-ui',
      files: files.length,
      bytes,
      budget: PUBLISH_BUDGET_BYTES,
    }),
  );
  assert(
    bytes <= PUBLISH_BUDGET_BYTES,
    `Published payload ${bytes} exceeds ${PUBLISH_BUDGET_BYTES} bytes`,
  );
});
