import { assertEquals, assertFalse } from '@std/assert';
import { delay } from 'jsr:@std/async@^1';

for (const mode of ['ready', 'registry-failed', 'dependency-failed', 'crash-loop']) {
  Deno.test(`background process HTTP health reports ${mode} without an app session`, async () => {
    const child = new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--no-check',
        '--allow-all',
        '--unstable-kv',
        new URL('./fixtures/child-process.ts', import.meta.url).pathname,
        mode,
      ],
      env: { PORT: '0', NO_COLOR: '1' },
      stdout: 'null',
      stderr: 'piped',
    }).spawn();
    const reader = child.stderr.getReader();
    let stderr = '';
    try {
      while (!/Listening on http:\/\/[^:]+:(\d+)/.test(stderr)) {
        const chunk = await reader.read();
        if (chunk.done) throw new Error(`Child exited before binding: ${stderr}`);
        stderr += new TextDecoder().decode(chunk.value);
        if (stderr.length > 4096) throw new Error('Child did not bind within bounded output.');
      }
      const port = /Listening on http:\/\/[^:]+:(\d+)/.exec(stderr)![1];
      // Bootstrap runs independently after the listener binds.
      await delay(30);
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      const payload = await response.json();
      assertEquals(response.status, mode === 'ready' ? 200 : 503);
      assertEquals(
        payload.state,
        mode === 'ready' ? 'ready' : mode === 'crash-loop' ? 'crash-looping' : 'failed',
      );
      assertEquals(payload.registryReady, mode !== 'registry-failed');
      assertEquals(payload.restartCount, mode === 'crash-loop' ? 3 : 0);
      assertFalse(JSON.stringify(payload).includes('secret-token'));
      const missing = await fetch(`http://127.0.0.1:${port}/missing`);
      assertEquals(missing.status, 404);
      await missing.body?.cancel();
    } finally {
      reader.releaseLock();
      child.kill('SIGTERM');
      await child.output();
    }
  });
}
