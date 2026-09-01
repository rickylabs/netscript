import {
  assert,
  assertEquals,
  assertFalse,
  assertRejects,
  assertStringIncludes,
} from '@std/assert';

interface ProbeModule {
  readonly DEV_STARTUP_BUDGET_MS: number;
  readonly FRESH_HTTP_READINESS_BUDGET_MS: number;
  waitForFreshDevServer(options: {
    startupSignal: Promise<void>;
    childStatus: Promise<Deno.CommandStatus>;
    fetchRoot: () => Promise<Response>;
    now: () => number;
    sleep: (milliseconds: number) => Promise<void>;
    startupBudgetMs?: number;
    httpReadinessBudgetMs?: number;
  }): Promise<Response>;
}

Deno.test('slow dependency preflight does not consume the Fresh HTTP readiness budget', async () => {
  const probe = await loadProbeModule();
  const startup = Promise.withResolvers<void>();
  let now = 0;
  let fetchCalls = 0;

  const responsePromise = probe.waitForFreshDevServer({
    startupSignal: startup.promise,
    childStatus: pending<Deno.CommandStatus>(),
    fetchRoot: () => {
      fetchCalls += 1;
      if (fetchCalls === 1) return Promise.reject(new TypeError('fetch failed'));
      return Promise.resolve(new Response('ok', { status: 200 }));
    },
    now: () => now,
    sleep: (milliseconds) => {
      if (milliseconds === probe.DEV_STARTUP_BUDGET_MS) return pending<void>();
      now += milliseconds;
      return Promise.resolve();
    },
  });

  await Promise.resolve();
  now = probe.DEV_STARTUP_BUDGET_MS - 1;
  startup.resolve();

  const response = await responsePromise;
  assert(response.ok);
  assertEquals(fetchCalls, 2);
  assert(probe.DEV_STARTUP_BUDGET_MS >= 180_000);
  assertEquals(probe.FRESH_HTTP_READINESS_BUDGET_MS, 60_000);
});

Deno.test('child exit fails promptly with its real status', async () => {
  const probe = await loadProbeModule();
  let sleepCalls = 0;

  const error = await assertRejects(
    () =>
      probe.waitForFreshDevServer({
        startupSignal: pending<void>(),
        childStatus: Promise.resolve(commandStatus(23)),
        fetchRoot: () => Promise.reject(new Error('must not fetch')),
        now: () => 0,
        sleep: () => {
          sleepCalls += 1;
          return pending<void>();
        },
      }),
    Error,
    'status=23',
  );

  assertStringIncludes(error.message, 'startup/preflight');
  assertEquals(sleepCalls, 1);
});

Deno.test('startup timeout is not reported as a Fresh server failure', async () => {
  const probe = await loadProbeModule();

  const error = await assertRejects(
    () =>
      probe.waitForFreshDevServer({
        startupSignal: pending<void>(),
        childStatus: pending<Deno.CommandStatus>(),
        fetchRoot: () => Promise.reject(new Error('must not fetch')),
        now: () => 0,
        sleep: () => Promise.resolve(),
        startupBudgetMs: 1,
      }),
    Error,
    'startup/preflight timed out',
  );

  assertFalse(error.message.includes('Fresh dev server failed'));
});

async function loadProbeModule(): Promise<ProbeModule> {
  return await import('./probe-project-boundary-dev.ts') as unknown as ProbeModule;
}

function pending<T>(): Promise<T> {
  return new Promise<T>(() => undefined);
}

function commandStatus(code: number): Deno.CommandStatus {
  return { success: code === 0, code, signal: null };
}
