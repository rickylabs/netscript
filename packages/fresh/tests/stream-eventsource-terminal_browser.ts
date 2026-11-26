import { assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';
import { runPlaywright } from './_fixtures/browser-runtime.ts';

const session = 'netscript-stream-eventsource-terminal';
const entryPath = fromFileUrl(
  new URL('../src/runtime/streams/create-stream-event-source.ts', import.meta.url),
);

async function bundleBrowserModule(): Promise<string> {
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      'bundle',
      '--platform',
      'browser',
      '--format',
      'esm',
      '--no-check',
      entryPath,
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(output.success, true, new TextDecoder().decode(output.stderr));
  return new TextDecoder().decode(output.stdout);
}

Deno.test({
  name:
    'production browser: native EventSource reports readyState === 2 on 401/403 proxy denials and stops reconnect spin',
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    const clientModuleJs = await bundleBrowserModule();
    let denied401Hits = 0;
    let denied403Hits = 0;
    const revokedRequests: string[] = [];

    const controller = new AbortController();
    const server = Deno.serve(
      { hostname: '127.0.0.1', port: 0, signal: controller.signal, onListen() {} },
      (req) => {
        const url = new URL(req.url);
        if (url.pathname === '/') {
          return new Response(
            '<!doctype html><html><head><meta charset="utf-8"></head><body><main id="app">ready</main></body></html>',
            { headers: { 'content-type': 'text/html; charset=utf-8' } },
          );
        }
        if (url.pathname === '/client.js') {
          return new Response(clientModuleJs, {
            headers: {
              'content-type': 'text/javascript; charset=utf-8',
              'cache-control': 'no-store',
            },
          });
        }
        if (url.pathname === '/api/streams/projects/denied-401') {
          denied401Hits += 1;
          return new Response(
            JSON.stringify({ error: 'UNAUTHORIZED', reason: 'session_revoked' }),
            {
              status: 401,
              headers: {
                'content-type': 'application/json; charset=utf-8',
                'cache-control': 'no-store',
              },
            },
          );
        }
        if (url.pathname === '/api/streams/projects/denied-403') {
          denied403Hits += 1;
          return new Response(JSON.stringify({ error: 'FORBIDDEN', reason: 'access_denied' }), {
            status: 403,
            headers: {
              'content-type': 'application/json; charset=utf-8',
              'cache-control': 'no-store',
            },
          });
        }
        if (url.pathname === '/api/streams/projects/revoked-midstream') {
          revokedRequests.push(`${url.pathname}${url.search}`);
          if (revokedRequests.length === 1) {
            const payload = JSON.stringify([{
              type: 'projects',
              key: 'p1',
              value: { title: 'first' },
              headers: {
                operation: 'upsert',
                correlationId: 'corr-1',
                traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
              },
            }]);
            const body = `event: data\ndata: ${payload}\n\nevent: control\ndata: ${
              JSON.stringify({ streamNextOffset: 'offset-committed-1' })
            }\n\n`;
            return new Response(body, {
              status: 200,
              headers: {
                'content-type': 'text/event-stream; charset=utf-8',
                'cache-control': 'no-store, no-cache, no-transform',
              },
            });
          }
          return new Response(
            JSON.stringify({ error: 'UNAUTHORIZED', reason: 'session_revoked' }),
            {
              status: 401,
              headers: {
                'content-type': 'application/json; charset=utf-8',
                'cache-control': 'no-store',
              },
            },
          );
        }
        return new Response('not found', { status: 404 });
      },
    );

    const addr = server.addr as Deno.NetAddr;
    const baseUrl = `http://${addr.hostname}:${addr.port}`;
    const output = await Deno.makeTempDir({ prefix: 'netscript-stream-browser-' });

    try {
      await runPlaywright(['-s', session, 'open', `${baseUrl}/`], output);
      const raw = await runPlaywright([
        '--raw',
        '-s',
        session,
        'run-code',
        `async page => {
          const pageErrors = [];
          page.on('pageerror', err => pageErrors.push(err.message));
          const result = await page.evaluate(async () => {
            const { createNetScriptStreamEventSourceV1 } = await import('/client.js');

            const runTerminalProbe = (path) => new Promise((resolve) => {
              let nativeSource = null;
              let reconnects = 0;
              let settled = false;
              const binding = createNetScriptStreamEventSourceV1({
                proxyUrl: location.origin + path,
                offset: '-1',
                createEventSource: (url) => {
                  nativeSource = new EventSource(url);
                  return nativeSource;
                },
                onEvent: (event) => {
                  if (event.event === 'error' && !settled) {
                    settled = true;
                    const readyState = nativeSource ? nativeSource.readyState : -1;
                    if (event.payload.retryable) reconnects += 1;
                    setTimeout(() => {
                      const readyStateAfterWait = nativeSource ? nativeSource.readyState : -1;
                      binding.dispose();
                      resolve({
                        readyState,
                        readyStateAfterWait,
                        code: event.payload.code,
                        retryable: event.payload.retryable,
                        lastCommittedOffset: event.payload.lastCommittedOffset,
                        reconnects,
                        url: binding.url,
                      });
                    }, 250);
                  }
                },
              });
            });

            const probe401 = await runTerminalProbe('/api/streams/projects/denied-401');
            const probe403 = await runTerminalProbe('/api/streams/projects/denied-403');

            // Mid-stream revocation: commit batch 1, reconnect once with lastCommittedOffset,
            // receive 401 -> native EventSource.readyState === 2 -> retryable === false -> stop.
            const midstream = await new Promise((resolve) => {
              let currentOffset = '-1';
              let binding = null;
              let nativeSource = null;
              const committed = [];
              let terminalEvent = null;
              let opens = 0;

              const open = () => {
                opens += 1;
                let uncommitted = [];
                binding = createNetScriptStreamEventSourceV1({
                  proxyUrl: location.origin + '/api/streams/projects/revoked-midstream',
                  offset: currentOffset,
                  createEventSource: (url) => {
                    nativeSource = new EventSource(url);
                    return nativeSource;
                  },
                  onEvent: (event) => {
                    if (event.event === 'data') {
                      uncommitted.push(...event.payload.map((c) => c.key));
                      return;
                    }
                    if (event.event === 'control') {
                      currentOffset = binding.snapshot().lastCommittedOffset ?? currentOffset;
                      committed.push(...uncommitted);
                      uncommitted = [];
                      return;
                    }
                    if (event.event === 'error') {
                      const readyState = nativeSource ? nativeSource.readyState : -1;
                      currentOffset = binding.snapshot().lastCommittedOffset ?? currentOffset;
                      uncommitted = [];
                      if (!event.payload.retryable) {
                        const terminalBinding = binding;
                        binding = null;
                        terminalEvent = {
                          readyState,
                          code: event.payload.code,
                          retryable: event.payload.retryable,
                          lastCommittedOffset: event.payload.lastCommittedOffset,
                        };
                        setTimeout(() => {
                          terminalBinding.dispose();
                          resolve({ committed, opens, terminalEvent });
                        }, 250);
                        return;
                      }
                      binding.dispose();
                      binding = null;
                      setTimeout(open, 20);
                    }
                  },
                });
              };
              open();
            });

            return { probe401, probe403, midstream };
          });
          return { result, pageErrors };
        }`,
      ], output);

      const parsed = JSON.parse(raw.trim());
      assertEquals(parsed.pageErrors, []);
      assertEquals(parsed.result.probe401, {
        readyState: 2,
        readyStateAfterWait: 2,
        code: 'transport-error',
        retryable: false,
        lastCommittedOffset: '-1',
        reconnects: 0,
        url: `${baseUrl}/api/streams/projects/denied-401?offset=-1`,
      });
      assertEquals(parsed.result.probe403, {
        readyState: 2,
        readyStateAfterWait: 2,
        code: 'transport-error',
        retryable: false,
        lastCommittedOffset: '-1',
        reconnects: 0,
        url: `${baseUrl}/api/streams/projects/denied-403?offset=-1`,
      });
      assertEquals(parsed.result.midstream, {
        committed: ['p1'],
        opens: 2,
        terminalEvent: {
          readyState: 2,
          code: 'transport-error',
          retryable: false,
          lastCommittedOffset: 'offset-committed-1',
        },
      });
      assertEquals(denied401Hits, 1);
      assertEquals(denied403Hits, 1);
      assertEquals(revokedRequests, [
        '/api/streams/projects/revoked-midstream?offset=-1',
        '/api/streams/projects/revoked-midstream?offset=offset-committed-1',
      ]);
    } finally {
      await runPlaywright(['-s', session, 'close'], output, false);
      controller.abort();
      await server.finished;
      await Deno.remove(output, { recursive: true });
    }
  },
});
