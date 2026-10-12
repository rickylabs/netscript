import { assertEquals, assertMatch } from '@std/assert';
import { MultiRuntimeTaskExecutor } from '../../src/executor/mod.ts';

const executor = new MultiRuntimeTaskExecutor();
const limit = 16384;
const encoder = new TextEncoder();

// A real listening resource holds the child alive without sleeps or polling.
// The runner owns termination; the child deliberately never consumes stdin.
const holdOpen = `const listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
await listener.accept();`;

for (const pipe of ['stdout', 'stderr'] as const) {
  Deno.test({
    name: `native output limit closes the over-budget pipe: ${pipe}`,
    sanitizeOps: true,
    sanitizeResources: true,
    async fn() {
      const result = await executor.execute({
        id: `bounded-${pipe}`,
        type: 'executable',
        entrypoint: 'node',
        args: ['-e', `process.${pipe}.write('x'.repeat(16385));`],
      }, {
        timeout: 10000,
        stdoutLimitBytes: limit,
        stderrLimitBytes: limit,
        streamLogs: false,
      });
      assertEquals(result.status, 'failed');
      assertEquals(result.success, false);
      assertEquals(result.exitCode, -1);
      assertMatch(
        result.error!,
        new RegExp(`^${pipe === 'stdout' ? 'Stdout' : 'Stderr'}LimitExceeded:`),
      );
      assertEquals(encoder.encode(result[pipe]).byteLength <= limit, true);
    },
  });
}

for (const pipes of [['stdout'], ['stderr'], ['stdout', 'stderr']] as const) {
  Deno.test({
    name: `output resource cleanup: ${pipes.join('+')} budget with blocked stdin`,
    sanitizeOps: true,
    sanitizeResources: true,
    async fn() {
      const writes = pipes.map((pipe) => `Deno.${pipe}.write(bytes)`).join(', ');
      const result = await executor.execute({
        id: 'blocked-stdin-budget',
        type: 'executable',
        entrypoint: Deno.execPath(),
        args: [
          'eval',
          `const bytes = new Uint8Array(16385).fill(120);
await Promise.all([${writes}]);
${holdOpen}`,
        ],
      }, {
        stdin: new Uint8Array(1048576),
        stdoutLimitBytes: limit,
        stderrLimitBytes: limit,
        timeout: 10000,
        streamLogs: false,
      });
      assertEquals(result.status, 'failed');
      assertEquals(result.success, false);
      assertEquals(result.exitCode, -1);
      assertMatch(result.error!, /^Std(out|err)LimitExceeded:/);
      if (pipes.length === 1) {
        assertMatch(
          result.error!,
          new RegExp(`^${pipes[0] === 'stdout' ? 'Stdout' : 'Stderr'}LimitExceeded:`),
        );
      }
      assertEquals(encoder.encode(result.stdout).byteLength <= limit, true);
      assertEquals(encoder.encode(result.stderr).byteLength <= limit, true);
    },
  });
}

Deno.test({
  name: 'output resource cleanup: running abort closes both pipes and blocked stdin',
  sanitizeOps: true,
  sanitizeResources: true,
  async fn() {
    const controller = new AbortController();
    let ready = false;
    const result = await executor.execute({
      id: 'resource-abort',
      type: 'executable',
      entrypoint: Deno.execPath(),
      args: ['eval', `console.log('ready'); ${holdOpen}`],
    }, {
      stdin: new Uint8Array(1048576),
      signal: controller.signal,
      timeout: 10000,
      onStdout(line) {
        assertEquals(line, 'ready');
        ready = true;
        controller.abort();
      },
    });
    assertEquals(ready, true);
    assertEquals(result.status, 'cancelled');
    assertEquals(result.success, false);
    assertEquals(result.exitCode, -1);
    assertEquals(result.error, 'Task cancelled.');
  },
});

Deno.test({
  name: 'output resource cleanup: deadline closes both pipes and blocked stdin',
  sanitizeOps: true,
  sanitizeResources: true,
  async fn() {
    const result = await executor.execute({
      id: 'resource-deadline',
      type: 'executable',
      entrypoint: Deno.execPath(),
      args: ['eval', holdOpen],
    }, {
      stdin: new Uint8Array(1048576),
      timeout: 250,
    });
    assertEquals(result.status, 'timeout');
    assertEquals(result.success, false);
    assertEquals(result.exitCode, -1);
    assertEquals(result.error, 'Task timeout.');
  },
});

Deno.test({
  name: 'output resource cleanup: normal exit preserves capture and stdin EOF',
  sanitizeOps: true,
  sanitizeResources: true,
  async fn() {
    const result = await executor.execute({
      id: 'resource-normal-exit',
      type: 'executable',
      entrypoint: Deno.execPath(),
      args: [
        'eval',
        `const input = await new Response(Deno.stdin.readable).text();
console.error('diagnostic');
console.log(JSON.stringify({ input }));`,
      ],
    }, {
      stdin: encoder.encode('bounded input'),
      stdoutLimitBytes: limit,
      stderrLimitBytes: limit,
      timeout: 10000,
    });
    assertEquals(result.status, 'completed');
    assertEquals(result.success, true);
    assertEquals(result.exitCode, 0);
    assertEquals(result.error, null);
    assertEquals(result.stdout, '{"input":"bounded input"}');
    assertEquals(result.stderr, 'diagnostic');
    assertEquals(result.result, { input: 'bounded input' });
  },
});
