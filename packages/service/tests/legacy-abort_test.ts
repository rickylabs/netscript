/**
 * Regression test for #176: scaffolded `@netscript/service` must not trip the
 * Deno 2.9 `Deno.serve` legacy abort-on-success deprecation on every successful
 * request, while keeping genuine request cancellation intact.
 *
 * The service runtime intentionally returns the app response on the handler's
 * return path (no side-effecting `request.signal` listener in the listener), and
 * scaffolded services opt into the non-legacy behavior with
 * `--unstable-no-legacy-abort`. This test boots the fixture service as a
 * subprocess with and without that flag and asserts the warning is present
 * (baseline) / absent (fixed), then asserts cancellation still propagates.
 *
 * @module
 */

import { assert, assertStringIncludes } from '@std/assert';
import { fromFileUrl } from '@std/path';

const FIXTURE = fromFileUrl(new URL('./_fixtures/legacy-abort-service.ts', import.meta.url));
const DEPRECATION_NEEDLE = 'request.signal aborts on successful responses';

interface SpawnedFixture {
  readonly child: Deno.ChildProcess;
  readonly port: number;
  readonly stdoutLines: AsyncIterableIterator<string>;
  readonly stderr: Promise<string>;
  readonly stdoutAbort: AbortController;
}

function lineReader(
  stream: ReadableStream<Uint8Array>,
  signal: AbortSignal,
): AsyncIterableIterator<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  return (async function* () {
    let cancellation: Promise<void> | undefined;
    const cancel = () => {
      cancellation = reader.cancel();
      void cancellation.catch(() => undefined);
    };
    signal.addEventListener('abort', cancel, { once: true });
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          if (buffer.trim().length > 0) yield buffer.trim();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        let index = buffer.indexOf('\n');
        while (index !== -1) {
          yield buffer.slice(0, index).trim();
          buffer = buffer.slice(index + 1);
          index = buffer.indexOf('\n');
        }
      }
    } finally {
      signal.removeEventListener('abort', cancel);
      try {
        await cancellation;
      } finally {
        reader.releaseLock();
      }
    }
  })();
}

function killFixture(child: Deno.ChildProcess): void {
  try {
    child.kill('SIGKILL');
  } catch {
    // already exited
  }
}

async function spawnFixture(extraFlags: readonly string[]): Promise<SpawnedFixture> {
  const command = new Deno.Command(Deno.execPath(), {
    args: ['run', '-A', ...extraFlags, FIXTURE],
    stdout: 'piped',
    stderr: 'piped',
  });
  const child = command.spawn();
  const stdoutAbort = new AbortController();
  const stdoutLines = lineReader(child.stdout, stdoutAbort.signal);
  const stderr = new Response(child.stderr).text();
  const fixture = { child, port: 0, stdoutLines, stderr, stdoutAbort };
  const deadline = setTimeout(() => killFixture(child), 10_000);

  // Wait for the READY <port> banner. Use manual `.next()` (not `for await`) so
  // breaking out does not call `.return()` and close the shared line reader —
  // later tests continue reading the same stream for `CANCELLED`.
  try {
    for (;;) {
      const { value, done } = await stdoutLines.next();
      if (done) break;
      const match = value.match(/^READY (\d+)$/);
      if (match) return { ...fixture, port: Number(match[1]) };
    }
    throw new Error('fixture exited before reporting READY');
  } catch (error) {
    await shutdown(fixture);
    throw error;
  } finally {
    clearTimeout(deadline);
  }
}

async function shutdown(fixture: SpawnedFixture): Promise<string> {
  killFixture(fixture.child);
  let timedOut = false;
  const deadline = setTimeout(() => {
    timedOut = true;
    fixture.stdoutAbort.abort();
    killFixture(fixture.child);
  }, 3000);
  try {
    const drained = (async () => {
      for await (const _line of fixture.stdoutLines) { /* retain stdout through EOF */ }
    })();
    const results = await Promise.allSettled([fixture.child.status, fixture.stderr, drained]);
    assert(!timedOut, 'fixture shutdown timed out before stdout EOF');
    for (const result of results) {
      if (result.status === 'rejected') throw result.reason;
    }
    const stderr = results[1];
    return stderr.status === 'fulfilled' ? stderr.value : '';
  } finally {
    clearTimeout(deadline);
  }
}

Deno.test('legacy Deno.serve behavior warns on successful requests (baseline repro)', async () => {
  const fixture = await spawnFixture([]);
  try {
    const res = await fetch(`http://127.0.0.1:${fixture.port}/ok`);
    assertStringIncludes(await res.text(), 'ok');
  } finally {
    const stderr = await shutdown(fixture);
    assertStringIncludes(
      stderr,
      DEPRECATION_NEEDLE,
      'expected the legacy abort-on-success deprecation without the flag (repro guard)',
    );
  }
});

Deno.test('no legacy-abort deprecation on successful requests with --unstable-no-legacy-abort', async () => {
  const fixture = await spawnFixture(['--unstable-no-legacy-abort']);
  try {
    for (let i = 0; i < 3; i += 1) {
      const res = await fetch(`http://127.0.0.1:${fixture.port}/ok`);
      assertStringIncludes(await res.text(), 'ok');
    }
  } finally {
    const stderr = await shutdown(fixture);
    assert(
      !stderr.includes(DEPRECATION_NEEDLE),
      `unexpected legacy-abort deprecation warning:\n${stderr}`,
    );
  }
});

Deno.test('client disconnect still cancels the in-flight request with the flag', async () => {
  const fixture = await spawnFixture(['--unstable-no-legacy-abort']);
  try {
    const controller = new AbortController();
    const pending = fetch(`http://127.0.0.1:${fixture.port}/cancel`, {
      signal: controller.signal,
    }).catch(() => undefined);

    // Give the request time to reach the handler, then abort from the client.
    await new Promise((resolve) => setTimeout(resolve, 400));
    controller.abort();
    await pending;

    // The fixture prints CANCELLED only if the handler's request signal fired,
    // i.e. genuine cancellation still propagates under the non-legacy behavior.
    let cancelled = false;
    const deadline = setTimeout(() => killFixture(fixture.child), 3000);
    try {
      for (;;) {
        const { value, done } = await fixture.stdoutLines.next();
        if (done) break;
        if (value === 'CANCELLED') {
          cancelled = true;
          break;
        }
      }
    } finally {
      clearTimeout(deadline);
    }
    assert(cancelled, 'expected the handler request signal to abort on client disconnect');
  } finally {
    await shutdown(fixture);
  }
});
