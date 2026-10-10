import { assertEquals, assertFalse, assertStringIncludes } from '@std/assert';

function spawn(mode: string) {
  return new Deno.Command(Deno.execPath(), {
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
}

async function bounded<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error('Child operation exceeded three seconds.')),
          3_000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function readUntil(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  pattern: RegExp,
): Promise<string> {
  let stderr = '';
  while (!pattern.test(stderr)) {
    const chunk = await bounded(reader.read());
    if (chunk.done) throw new Error(`Child exited before expected diagnostic: ${stderr}`);
    stderr += new TextDecoder().decode(chunk.value);
    if (stderr.length > 16_384) throw new Error('Child exceeded bounded diagnostic output.');
  }
  return stderr;
}

async function cleanup(child: Deno.ChildProcess): Promise<void> {
  try {
    child.kill('SIGTERM');
  } catch (cause) {
    if (
      !(cause instanceof Deno.errors.NotFound) &&
      !(cause instanceof TypeError && cause.message === 'Child process has already terminated')
    ) {
      throw cause;
    }
  }
  await child.output();
}

for (const mode of ['ready', 'registry-failed', 'dependency-failed', 'crash-loop']) {
  Deno.test(`background process HTTP health reports ${mode} without an app session`, async () => {
    const child = spawn(mode);
    const reader = child.stderr.getReader();
    try {
      // Fixture readiness or the failure diagnostic proves bootstrap settled; no timing sleep.
      const stderr = await readUntil(reader, /fixture-ready|Background child failed:/);
      const port = /Listening on http:\/\/[^:]+:(\d+)/.exec(stderr)![1];
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
      if (mode.endsWith('failed')) {
        assertStringIncludes(stderr, `secret-token=${mode.split('-')[0]}-password`);
        assertStringIncludes(stderr, 'Error:');
      }
      const missing = await fetch(`http://127.0.0.1:${port}/missing`);
      assertEquals(missing.status, 404);
      await missing.body?.cancel();
    } finally {
      reader.releaseLock();
      await cleanup(child);
    }
  });
}

for (const mode of ['registry-failed', 'dependency-failed', 'completed', 'leaked-handle']) {
  Deno.test(`fatal ${mode} exits nonzero without an operator signal`, async () => {
    const child = spawn(mode);
    const reader = child.stderr.getReader();
    try {
      await readUntil(reader, /Listening on http:\/\/[^:]+:(\d+)/);
      const status = await bounded(child.status);
      assertEquals(status.code, 1);
      assertEquals(status.success, false);
    } finally {
      reader.releaseLock();
      await cleanup(child);
    }
  });
}
