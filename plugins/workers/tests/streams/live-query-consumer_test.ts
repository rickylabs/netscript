import { assert, assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';

Deno.test({
  name: 'all four public StreamDB factories preserve live-query entity and lifecycle types',
  sanitizeOps: true,
  sanitizeResources: true,
  sanitizeExit: true,
  async fn() {
    const fixture = fromFileUrl(new URL('./live-query-consumer_type.ts', import.meta.url));
    assert(fixture.length > 0 && (await Deno.stat(fixture)).size > 0);
    const deadline = new AbortController();
    const timer = setTimeout(
      () => deadline.abort(new Error('Consumer compiler deadline.')),
      30_000,
    );
    try {
      const output = await new Deno.Command(Deno.execPath(), {
        args: ['check', '--unstable-kv', fixture],
        signal: deadline.signal,
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      deadline.signal.throwIfAborted();
      const text = new TextDecoder().decode(output.stderr);
      assertEquals(output.code, 0, text);
      assert(
        !/No matching|No target|Module not found|not mapped|unresolved|TS\d+/i.test(text),
        text,
      );
    } finally {
      clearTimeout(timer);
    }
  },
});
