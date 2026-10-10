import { assertEquals } from '@std/assert';

Deno.test('all four public StreamDB factories preserve live-query entity and lifecycle types', async () => {
  const fixture = new URL('./live-query-consumer_type.ts', import.meta.url);
  const output = await new Deno.Command(Deno.execPath(), {
    args: ['check', '--unstable-kv', fixture.pathname],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
});
