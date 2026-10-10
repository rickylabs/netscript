import { assertEquals, assertInstanceOf, assertMatch, assertThrows } from '@std/assert';
import type { TaskStdinJson } from '../../src/executor/mod.ts';
import { defineTask as defineRootTask } from '../../mod.ts';
import { defineTask } from '../../src/builders/mod.ts';
import {
  createDefaultTaskExecutor,
  ExecutableRuntimeAdapter,
  runProcess,
} from '../../src/executor/mod.ts';

const executor = createDefaultTaskExecutor();
const echo =
  "import json,sys; payload=json.load(sys.stdin); print(json.dumps({'payload':payload}))";

function pythonTask() {
  return defineTask('stdin-python').runtime('executable').entrypoint('python3').args('-c', echo);
}

Deno.test('stdin payload: polyglot task reads builder JSON once and sees EOF', async () => {
  const input = { uid: 'private-value', roots: ['native-root'], unicode: '😀\ud800' };
  const builder = pythonTask().stdin(input);
  input.uid = 'mutated';
  const result = await executor.execute(builder.build());
  assertEquals(result.success, true);
  assertEquals(result.result, {
    payload: { uid: 'private-value', roots: ['native-root'], unicode: '😀\ud800' },
  });
});

Deno.test('stdin payload: execution JSON overrides builder bytes without argv or env exposure', async () => {
  const code =
    "import json,os,sys; p=json.load(sys.stdin); print(json.dumps({'payload':p,'leaked':str(p['secret']) in str(sys.argv)+str(dict(os.environ)), 'correlation':os.getenv('CORRELATION_ID'),'traceparent':os.getenv('TRACEPARENT')}))";
  const task = defineTask('stdin-context').runtime('executable').entrypoint('python3')
    .args('-c', code).stdin(new TextEncoder().encode('{"secret":"old"}')).build();
  const result = await executor.execute(task, {
    stdin: { secret: 'unique-private-payload-marker' },
    correlationId: 'queued-correlation',
    traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01',
  });
  assertEquals(result.success, true);
  assertEquals(result.result, {
    payload: { secret: 'unique-private-payload-marker' },
    leaked: false,
    correlation: 'queued-correlation',
    traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01',
  });
});

Deno.test('stdin payload: missing explicit payload gives MissingStdinPayload', async () => {
  assertThrows(() => pythonTask().stdin(undefined!), Error, 'MissingStdinPayload');
  const result = await executor.execute(pythonTask().build(), { stdin: undefined });
  assertEquals(result.status, 'failed');
  assertMatch(result.error!, /^MissingStdinPayload:/);
});

Deno.test('stdin payload: oversized bytes or JSON gives StdinPayloadTooLarge before spawn', async () => {
  assertThrows(() => pythonTask().stdin(new Uint8Array(1048577)), Error, 'StdinPayloadTooLarge');
  for (const stdin of [new Uint8Array(1048577), { data: 'x'.repeat(1048576) }]) {
    const result = await executor.execute(pythonTask().build(), { stdin });
    assertEquals(result.status, 'failed');
    assertEquals(result.stdout, '');
    assertMatch(result.error!, /^StdinPayloadTooLarge:/);
  }
});

Deno.test('stdin payload: exactly 1 MiB bytes is delivered with backpressure', async () => {
  const task = defineTask('stdin-boundary').runtime('executable').entrypoint('python3')
    .args('-c', "import json,sys; print(json.dumps({'size':len(sys.stdin.buffer.read())}))")
    .build();
  const result = await executor.execute(task, { stdin: new Uint8Array(1048576) });
  assertEquals(result.success, true);
  assertEquals(result.result, { size: 1048576 });
});

Deno.test('stdin payload: root builder exposes the same bounded channel', () => {
  const task = defineRootTask('root-stdin').runtime('python').entrypoint('script.py')
    .stdin({ enabled: true }).build();
  assertInstanceOf(task.stdin, Uint8Array);
  assertEquals(new TextDecoder().decode(task.stdin), '{"enabled":true}');
});

Deno.test('stdin payload: invalid JSON fails closed without leaking payload', () => {
  const cycle: Record<string, TaskStdinJson> = {};
  cycle.self = cycle;
  assertThrows(() => pythonTask().stdin(cycle), Error, 'InvalidStdinPayload');
  assertThrows(() => pythonTask().stdin(NaN), Error, 'InvalidStdinPayload');
});

Deno.test('stdin payload: absent stdin never inherits parent input', async () => {
  const moduleUrl = new URL('../../src/executor/mod.ts', import.meta.url).href;
  const script = `import {createDefaultTaskExecutor} from ${JSON.stringify(moduleUrl)};
const result = await createDefaultTaskExecutor().execute({id:'absent',type:'executable',entrypoint:'python3',args:['-c',"import json,sys; print(json.dumps({'input':sys.stdin.read()}))"]});
console.log(JSON.stringify(result));`;
  const child = new Deno.Command(Deno.execPath(), {
    args: ['eval', script],
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode('parent-private-input'));
  await writer.close();
  writer.releaseLock();
  const output = await child.output();
  assertEquals(output.success, true, new TextDecoder().decode(output.stderr));
  const result = JSON.parse(new TextDecoder().decode(output.stdout));
  assertEquals(result.success, true);
  assertEquals(result.result, { input: '' });
});

for (const source of ['stdout', 'stderr'] as const) {
  Deno.test(`output cap: ${source} limit fails closed even without log callbacks`, async () => {
    const task = defineTask(`cap-${source}`).runtime('executable').entrypoint(Deno.execPath())
      .args(
        'eval',
        source === 'stdout' ? 'console.log("x".repeat(10000))' : 'console.error("x".repeat(10000))',
      )
      .build();
    const adapter = new ExecutableRuntimeAdapter({
      stdoutLimitBytes: 64,
      stderrLimitBytes: 64,
    });
    const result = await adapter.execute(task, {
      args: [],
      cwd: Deno.cwd(),
      env: {},
      timeout: 5000,
      streamLogs: false,
    });
    assertEquals(result.status, 'failed');
    assertEquals(result.success, false);
    assertMatch(
      result.error!,
      new RegExp(`^${source === 'stdout' ? 'Stdout' : 'Stderr'}LimitExceeded:`),
    );
    assertEquals(result[source].length <= 64, true);
  });
}

Deno.test('process lifecycle: running abort cancels blocked stdin and drains streams', async () => {
  const task = defineTask('cancel-stdin').runtime('executable').entrypoint(Deno.execPath())
    .args('eval', 'console.log("ready"); await new Promise(resolve=>setTimeout(resolve,60000))')
    .build();
  const controller = new AbortController();
  const result = await executor.execute(task, {
    stdin: new Uint8Array(1048576),
    signal: controller.signal,
    onStdout: () => controller.abort(),
    timeout: 5000,
  });
  assertEquals(result.status, 'cancelled');
  assertEquals(result.exitCode, -1);
});

Deno.test('process lifecycle: running timeout has explicit timeout status', async () => {
  const task = defineTask('timeout-stdin').runtime('executable').entrypoint(Deno.execPath())
    .args('eval', 'await new Promise(resolve=>setTimeout(resolve,60000))').build();
  const result = await executor.execute(task, { stdin: new Uint8Array(1048576), timeout: 100 });
  assertEquals(result.status, 'timeout');
  assertEquals(result.exitCode, -1);
});

Deno.test('stdin payload: early pipe closure gives StdinWriteFailed and terminates child', async () => {
  const task = defineTask('closed-stdin').runtime('executable').entrypoint('python3')
    .args('-c', 'import os,time; os.close(0); time.sleep(60)')
    .build();
  const result = await executor.execute(task, { stdin: new Uint8Array(1048576), timeout: 5000 });
  assertEquals(result.status, 'failed');
  assertEquals(result.success, false);
  assertMatch(result.error!, /^StdinWriteFailed:/);
});

for (const streamLogs of [true, false]) {
  Deno.test(`default output: chatty task survives with bounded tails (streamLogs=${streamLogs})`, async () => {
    let lines = 0;
    const task = defineTask('chatty').runtime('executable').entrypoint(Deno.execPath())
      .args(
        'eval',
        `for(let i=0;i<2048;i++) { console.log('x'.repeat(1024)); console.error('y'.repeat(1024)); }
console.log('{"done":true}');`,
      ).build();
    const result = await executor.execute(task, { streamLogs, onStdout: () => lines++ });
    assertEquals(result.status, 'completed');
    assertEquals(result.exitCode, 0);
    assertEquals(result.result, { done: true });
    assertEquals(result.stdout.length <= 1048576, true);
    assertEquals(result.stderr.length <= 1048576, true);
    assertEquals(lines, streamLogs ? 2049 : 0);
  });
}

Deno.test('default output: newline-free output is bounded and streamed in fragments', async () => {
  let streamed = 0;
  const task = defineTask('long-line').runtime('executable').entrypoint(Deno.execPath())
    .args('eval', `console.log('x'.repeat(3*1048576)); console.log('{"done":true}');`).build();
  const result = await executor.execute(task, { onStdout: (line) => streamed += line.length });
  assertEquals(result.success, true);
  assertEquals(result.result, { done: true });
  assertEquals(result.stdout.length <= 1048576, true);
  assertEquals(streamed, 3 * 1048576 + '{"done":true}'.length);
});

for (const mode of ['cancelled', 'timeout'] as const) {
  Deno.test({
    name: `process tree: ${mode} terminates a shell wrapper and its pipe-holding grandchild`,
    ignore: Deno.build.os !== 'linux',
    async fn() {
      const dir = await Deno.makeTempDir();
      let pid: number | undefined;
      let watchdog: ReturnType<typeof setTimeout> | undefined;
      const controller = new AbortController();
      try {
        await Deno.writeTextFile(
          `${dir}/child.ts`,
          `console.log(Deno.pid);
await new Promise(resolve => setTimeout(resolve, 60000));`,
        );
        // A real wrapper keeps a grandchild alive with inherited stdout/stderr.
        await Deno.writeTextFile(`${dir}/wrapper.sh`, '"$1" run "$2" &\nwait\n');
        const task = defineTask('wrapper').runtime('executable').entrypoint('sh')
          .args(`${dir}/wrapper.sh`, Deno.execPath(), `${dir}/child.ts`).build();
        const started = Date.now();
        const result = await executor.execute(task, {
          timeout: mode === 'timeout' ? 500 : 5000,
          signal: controller.signal,
          onStdout(line) {
            pid = Number(line);
            // This owned-PID watchdog also makes the regression test safe on old code.
            watchdog = setTimeout(() => {
              try {
                Deno.kill(pid!, 'SIGKILL');
              } catch { /* Exited. */ }
            }, 1500);
            if (mode === 'cancelled') controller.abort();
          },
        });
        assertEquals(result.status, mode);
        assertEquals(result.exitCode, -1);
        assertEquals(Date.now() - started < 1200, true);
        assertEquals(Number.isSafeInteger(pid), true);
        // A reparented zombie is already terminated and owns no pipes or memory.
        let dead = false;
        for (let attempt = 0; attempt < 50 && !dead; attempt++) {
          try {
            const stat = await Deno.readTextFile(`/proc/${pid}/stat`);
            dead = stat.slice(stat.lastIndexOf(')') + 2).split(' ')[0] === 'Z';
          } catch (error) {
            if (!(error instanceof Deno.errors.NotFound)) throw error;
            dead = true;
          }
          if (!dead) await new Promise((resolve) => setTimeout(resolve, 10));
        }
        assertEquals(dead, true);
      } finally {
        clearTimeout(watchdog);
        if (pid !== undefined) {
          try {
            Deno.kill(pid, 'SIGKILL');
          } catch { /* Exited. */ }
        }
        await Deno.remove(dir, { recursive: true });
      }
    },
  });
}

Deno.test('stdin payload: adapter passes the builder snapshot directly to the runner', async () => {
  const source = new TextEncoder().encode('{"value":"snapshot"}');
  const builder = pythonTask().stdin(source);
  source.fill(0);
  const task = builder.build();
  assertEquals(task.stdin === builder.build().stdin, false);
  const adapter = new ExecutableRuntimeAdapter({
    runner: {
      run(input) {
        assertEquals(input.stdin === task.stdin, true);
        return runProcess(input);
      },
    },
  });
  const result = await adapter.execute(task, { args: [], cwd: '', env: {}, timeout: 5000 });
  assertEquals(result.success, true, result.error ?? undefined);
  assertEquals(result.result, { payload: { value: 'snapshot' } });
});
