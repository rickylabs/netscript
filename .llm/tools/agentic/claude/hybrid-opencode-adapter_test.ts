import { assertEquals, assertRejects } from '@std/assert';
import { HYBRID_DELEGATION_DEFAULT_MODEL } from '../config/models.ts';
import { HYBRID_DELEGATION_LIMITS, HybridDelegationError } from './hybrid-delegation.ts';
import {
  HybridOpenCodeAdapter,
  hybridWorkerEnvironment,
  type HybridWorkerInvocation,
  type HybridWorkerPort,
  type HybridWorkerProcess,
} from './hybrid-opencode-adapter.ts';

const encoder = new TextEncoder();

function stream(text: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

async function waitFor(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt++) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error('condition was not reached');
}

class FakeProcess implements HybridWorkerProcess {
  readonly stdout: ReadableStream<Uint8Array>;
  readonly stderr: ReadableStream<Uint8Array>;
  readonly status: Promise<{ code: number; success: boolean }>;
  killed = false;
  readonly signals: Deno.Signal[] = [];
  #resolve!: (status: { code: number; success: boolean }) => void;

  constructor(output = '{"type":"text","part":{"text":"DONE"}}\n', error = '', pending = false) {
    this.stdout = stream(output);
    this.stderr = stream(error);
    this.status = new Promise((resolve) => this.#resolve = resolve);
    if (!pending) this.#resolve({ code: error ? 1 : 0, success: !error });
  }

  finish(): void {
    this.#resolve({ code: 0, success: true });
  }

  killProcessGroup(signal: Deno.Signal): void {
    this.killed = true;
    this.signals.push(signal);
    this.#resolve({ code: 143, success: false });
  }
}

class FakeWorker implements HybridWorkerPort {
  readonly invocations: HybridWorkerInvocation[] = [];
  readonly processes: FakeProcess[] = [];
  constructor(readonly create: () => FakeProcess = () => new FakeProcess()) {}

  spawn(invocation: HybridWorkerInvocation): HybridWorkerProcess {
    this.invocations.push(invocation);
    const process = this.create();
    this.processes.push(process);
    return process;
  }
}

function adapter(worker: HybridWorkerPort): HybridOpenCodeAdapter {
  return new HybridOpenCodeAdapter({
    cwd: '/workspace',
    env: {
      HOME: '/home/test',
      PATH: '/bin',
      OPENROUTER_API_KEY: 'or-secret-value',
      ANTHROPIC_API_KEY: 'claude-secret',
      CLAUDE_CODE_OAUTH_TOKEN: 'oauth-secret',
      OTHER_API_KEY: 'unrelated-secret',
    },
    worker,
    now: (() => {
      let time = 100;
      return () => time += 5;
    })(),
  });
}

Deno.test('worker environment is allow-listed and isolates Claude/provider credentials', async () => {
  const env = await hybridWorkerEnvironment({
    HOME: '/home/test',
    PATH: '/bin',
    OPENROUTER_API_KEY: 'worker-only',
    ANTHROPIC_API_KEY: 'must-not-cross',
    CLAUDE_CODE_OAUTH_TOKEN: 'must-not-cross',
    RANDOM_SECRET: 'must-not-cross',
  });
  assertEquals(env, {
    HOME: '/home/test',
    PATH: '/bin',
    OPENROUTER_API_KEY: 'worker-only',
  });
});

Deno.test('adapter uses argv without a shell and reports requested/observed route identity', async () => {
  const worker = new FakeWorker();
  const result = await adapter(worker).delegate({ task: 'say DONE' });
  assertEquals(result.output, 'DONE');
  assertEquals(result.requested, {
    provider: 'openrouter',
    model: HYBRID_DELEGATION_DEFAULT_MODEL,
    effort: 'high',
  });
  assertEquals(result.observed, { ...result.requested, source: 'opencode_argv' });
  assertEquals(result.durationMs, 5);
  assertEquals(worker.invocations.length, 1);
  const invocation = worker.invocations[0];
  assertEquals(invocation.command, 'opencode');
  assertEquals(invocation.cwd, '/workspace');
  assertEquals(invocation.args[0], 'run');
  assertEquals(invocation.args.includes('--format'), true);
  assertEquals(invocation.args.includes('json'), true);
  assertEquals(invocation.args.includes(`openrouter/${HYBRID_DELEGATION_DEFAULT_MODEL}`), true);
  assertEquals(invocation.env.ANTHROPIC_API_KEY, undefined);
  assertEquals(invocation.env.CLAUDE_CODE_OAUTH_TOKEN, undefined);
  assertEquals(invocation.env.OTHER_API_KEY, undefined);
});

Deno.test('adapter terminates oversized output', async () => {
  const worker = new FakeWorker(() =>
    new FakeProcess('x'.repeat(HYBRID_DELEGATION_LIMITS.resultBytes + 1), '', true)
  );
  const error = await assertRejects(() => adapter(worker).delegate({ task: 'work' }));
  assertEquals((error as HybridDelegationError).code, 'result_too_large');
  assertEquals(worker.processes[0].killed, true);
});

Deno.test('adapter propagates AbortSignal and terminates the worker', async () => {
  const worker = new FakeWorker(() => new FakeProcess('', '', true));
  const controller = new AbortController();
  const pending = adapter(worker).delegate({ task: 'work' }, controller.signal);
  await waitFor(() => worker.processes.length === 1);
  controller.abort();
  const error = await assertRejects(() => pending);
  assertEquals((error as HybridDelegationError).code, 'cancelled');
  assertEquals(worker.processes[0].killed, true);
});

Deno.test('adapter enforces timeout and terminates the worker', async () => {
  const worker = new FakeWorker(() => new FakeProcess('', '', true));
  const error = await assertRejects(() => adapter(worker).delegate({ task: 'work', timeoutMs: 1 }));
  assertEquals((error as HybridDelegationError).code, 'timed_out');
  assertEquals(worker.processes[0].killed, true);
});

Deno.test('adapter redacts worker credentials from failure diagnostics', async () => {
  const worker = new FakeWorker(() => new FakeProcess('', 'failed with or-secret-value'));
  const error = await assertRejects(() => adapter(worker).delegate({ task: 'work' }));
  assertEquals((error as Error).message.includes('or-secret-value'), false);
  assertEquals((error as Error).message.includes('[REDACTED]'), true);
});

Deno.test('adapter rejects protected credentials reflected in successful output', async () => {
  const worker = new FakeWorker(() =>
    new FakeProcess('{"type":"text","part":{"text":"or-secret-value"}}\n')
  );
  const error = await assertRejects(() => adapter(worker).delegate({ task: 'work' }));
  assertEquals((error as Error).message.includes('or-secret-value'), false);
  assertEquals((error as HybridDelegationError).code, 'worker_failed');
});

Deno.test('adapter escalates timed-out process-group cleanup from TERM to KILL', async () => {
  const worker = new FakeWorker(() => new FakeProcess('', '', true));
  await assertRejects(() => adapter(worker).delegate({ task: 'work', timeoutMs: 1 }));
  await new Promise((resolve) =>
    setTimeout(resolve, HYBRID_DELEGATION_LIMITS.terminationGraceMs + 20)
  );
  assertEquals(worker.processes[0].signals, ['SIGTERM', 'SIGKILL']);
});

Deno.test('adapter bounds concurrent workers and releases the queue', async () => {
  const worker = new FakeWorker(() => new FakeProcess(undefined, '', true));
  const subject = new HybridOpenCodeAdapter({
    cwd: '/workspace',
    env: { OPENROUTER_API_KEY: 'key' },
    worker,
  });
  const first = subject.delegate({ task: 'one' });
  const second = subject.delegate({ task: 'two' });
  const third = subject.delegate({ task: 'three' });
  await waitFor(() => worker.invocations.length === 2);
  assertEquals(worker.invocations.length, 2);
  worker.processes[0].finish();
  await first;
  await waitFor(() => worker.invocations.length === 3);
  assertEquals(worker.invocations.length, 3);
  worker.processes[1].finish();
  worker.processes[2].finish();
  await Promise.all([second, third]);
});
