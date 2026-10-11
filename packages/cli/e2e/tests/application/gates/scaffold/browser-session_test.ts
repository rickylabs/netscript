import { assertEquals, assertRejects, assertStrictEquals, assertStringIncludes } from '@std/assert';
import { delay } from '@std/async';
import { join } from '@std/path';
import { browserValue, findTarget, withBrowser } from './browser-session.ts';

Deno.test('DevTools discovery retries a one-second request timeout within its startup budget', async () => {
  const profile = await Deno.makeTempDir();
  let requests = 0;
  const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen() {} }, async () => {
    if (++requests === 1) await delay(1100);
    return Response.json([{
      type: 'page',
      webSocketDebuggerUrl: 'ws://127.0.0.1/devtools/page/test',
    }]);
  });
  try {
    await Deno.writeTextFile(
      join(profile, 'DevToolsActivePort'),
      `${server.addr.port}\n/browser/test`,
    );
    assertEquals(await findTarget(profile), 'ws://127.0.0.1/devtools/page/test');
    assertEquals(requests, 2);
  } finally {
    await server.shutdown();
    await Deno.remove(profile, { recursive: true });
  }
});

Deno.test('DevTools discovery retries a stalled response body, HTTP failure, and non-page targets', async () => {
  const profile = await Deno.makeTempDir();
  let requests = 0;
  const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen() {} }, () => {
    switch (++requests) {
      case 1:
        return new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode('['));
            },
          }),
        );
      case 2:
        return new Response('starting', { status: 503 });
      case 3:
        return new Response('partial JSON');
      case 4:
        return Response.json([{ type: 'service_worker', webSocketDebuggerUrl: 'ws://worker' }]);
      default:
        return Response.json([{ type: 'page', webSocketDebuggerUrl: 'ws://page' }]);
    }
  });
  try {
    await Deno.writeTextFile(join(profile, 'DevToolsActivePort'), `${server.addr.port}\n`);
    assertEquals(await findTarget(profile, { requestTimeoutMs: 50 }), 'ws://page');
    assertEquals(requests, 5);
  } finally {
    await server.shutdown();
    await Deno.remove(profile, { recursive: true });
  }
});

Deno.test('DevTools discovery waits for an incomplete port file and refuses invalid ports', async () => {
  const profile = await Deno.makeTempDir();
  const server = Deno.serve(
    { hostname: '127.0.0.1', port: 0, onListen() {} },
    () => Response.json([{ type: 'page', webSocketDebuggerUrl: 'ws://page' }]),
  );
  try {
    await Deno.writeTextFile(join(profile, 'DevToolsActivePort'), '');
    const discovery = findTarget(profile);
    await delay(70);
    await Deno.writeTextFile(join(profile, 'DevToolsActivePort'), `${server.addr.port}\n`);
    assertEquals(await discovery, 'ws://page');
    await Deno.writeTextFile(join(profile, 'DevToolsActivePort'), '65536\n');
    const error = await assertRejects(() => findTarget(profile, { timeoutMs: 70 }), Error);
    assertStringIncludes(error.message, 'invalid port');
    assertStringIncludes(error.message, 'requests: 0');
  } finally {
    await server.shutdown();
    await Deno.remove(profile, { recursive: true });
  }
});

Deno.test('DevTools discovery diagnoses the bounded deadline during a stalled request', async () => {
  const profile = await Deno.makeTempDir();
  const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen() {} }, async () => {
    await delay(250);
    return Response.json([]);
  });
  try {
    await Deno.writeTextFile(join(profile, 'DevToolsActivePort'), `${server.addr.port}\n`);
    const error = await assertRejects(
      () => findTarget(profile, { timeoutMs: 120, requestTimeoutMs: 30 }),
      Error,
    );
    assertStringIncludes(error.message, 'deadline exceeded after 120 ms');
    assertStringIncludes(error.message, 'stage: requesting /json/list');
    assertStringIncludes(error.message, 'TimeoutError');
    assertStringIncludes(error.message, 'available CPU/memory');
  } finally {
    await server.shutdown();
    await Deno.remove(profile, { recursive: true });
  }
});

Deno.test('DevTools discovery cancels polling and an in-flight request without leaked timers', async () => {
  const profile = await Deno.makeTempDir();
  const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen() {} }, async () => {
    await delay(200);
    return Response.json([]);
  });
  try {
    for (const withPort of [false, true]) {
      if (withPort) {
        await Deno.writeTextFile(join(profile, 'DevToolsActivePort'), `${server.addr.port}\n`);
      }
      const controller = new AbortController();
      const sentinel = new Error('browser child exited');
      const discovery = findTarget(profile, { signal: controller.signal });
      const rejected = assertRejects(() => discovery, Error);
      await delay(20);
      controller.abort(sentinel);
      assertStrictEquals(await rejected, sentinel);
    }
  } finally {
    await server.shutdown();
    await Deno.remove(profile, { recursive: true });
  }
});

Deno.test('DevTools discovery fails on unexpected filesystem errors', async () => {
  const profile = await Deno.makeTempFile();
  try {
    await assertRejects(() => findTarget(profile), Deno.errors.NotADirectory);
  } finally {
    await Deno.remove(profile);
  }
});

Deno.test('browser session fails explicitly for an unusable exclusive browser override', async () => {
  const previous = Deno.env.get('NETSCRIPT_E2E_BROWSER_EXECUTABLE');
  const root = await Deno.makeTempDir();
  try {
    Deno.env.set('NETSCRIPT_E2E_BROWSER_EXECUTABLE', join(root, 'missing-browser'));
    const error = await assertRejects(() =>
      withBrowser(async (browser) => {
        await browserValue(browser, 'true');
      }), Error);
    assertStringIncludes(error.message, 'NETSCRIPT_E2E_BROWSER_EXECUTABLE');
    assertStringIncludes(error.message, 'missing-browser');
  } finally {
    if (previous === undefined) Deno.env.delete('NETSCRIPT_E2E_BROWSER_EXECUTABLE');
    else Deno.env.set('NETSCRIPT_E2E_BROWSER_EXECUTABLE', previous);
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test({
  name: 'browser session reports an early headless process exit with version and stderr',
  ignore: Deno.build.os === 'windows',
  async fn() {
    const previous = Deno.env.get('NETSCRIPT_E2E_BROWSER_EXECUTABLE');
    const root = await Deno.makeTempDir();
    try {
      const executable = join(root, 'browser');
      await Deno.writeTextFile(
        executable,
        `#!/bin/sh
if [ "$1" = "--version" ]; then
  echo 'Chromium 151.0'
  exit 0
fi
echo 'headless dependency sentinel' >&2
exit 2
`,
      );
      await Deno.chmod(executable, 0o755);
      Deno.env.set('NETSCRIPT_E2E_BROWSER_EXECUTABLE', executable);
      const error = await assertRejects(() => withBrowser(async () => {}), Error);
      assertStringIncludes(error.message, 'code 2');
      assertStringIncludes(error.message, 'Chromium 151.0');
      assertStringIncludes(error.message, 'headless dependency sentinel');
    } finally {
      if (previous === undefined) Deno.env.delete('NETSCRIPT_E2E_BROWSER_EXECUTABLE');
      else Deno.env.set('NETSCRIPT_E2E_BROWSER_EXECUTABLE', previous);
      await Deno.remove(root, { recursive: true });
    }
  },
});
