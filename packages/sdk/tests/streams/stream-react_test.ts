import { assertEquals } from '@std/assert';

Deno.test('Expo-pinned React hook regressions run in the reference compiler context', async () => {
  const reference = new URL('../../../../resources/examples/expo-streams/', import.meta.url);
  const result = await new Deno.Command(Deno.execPath(), {
    cwd: reference,
    env: { NO_COLOR: '1' },
    args: [
      'test',
      '--lock=deno.lock',
      '--frozen',
      '--unstable-kv',
      '--allow-all',
      'stream-react.fixture.ts',
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const output = new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr);
  assertEquals(result.code, 0, output);
  assertEquals(output.includes('2 passed | 0 failed'), true, output);
});
