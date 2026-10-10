import { assertEquals, assertMatch, assertThrows } from '@std/assert';
import { defineTask as defineRootTask } from '../../mod.ts';
import { defineTask } from '../../src/builders/mod.ts';
import { createDefaultTaskExecutor, ExecutableRuntimeAdapter } from '../../src/executor/mod.ts';

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
  assertEquals(new TextDecoder().decode(task.stdin as Uint8Array), '{"enabled":true}');
});

Deno.test('stdin payload: invalid JSON fails closed without leaking payload', () => {
  const cycle: Record<string, unknown> = {};
  cycle.self = cycle;
  assertThrows(() => pythonTask().stdin(cycle as never), Error, 'InvalidStdinPayload');
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
