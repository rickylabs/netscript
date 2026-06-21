import { assertEquals, assertObjectMatch, assertStrictEquals } from '@std/assert';
import { ServiceShutdownCoordinator } from '../src/builder/service-shutdown.ts';

function createCoordinator(
  options: {
    readonly hooks?: ConstructorParameters<typeof ServiceShutdownCoordinator>[0]['hooks'];
    readonly drainTimeoutMs?: number;
    readonly shutdownServer?: () => Promise<void>;
    readonly awaitServerFinished?: () => Promise<void>;
  } = {},
): {
  readonly controller: AbortController;
  readonly coordinator: ServiceShutdownCoordinator;
} {
  const controller = new AbortController();
  return {
    controller,
    coordinator: new ServiceShutdownCoordinator({
      controller,
      shutdownServer: options.shutdownServer ?? (() => Promise.resolve()),
      awaitServerFinished: options.awaitServerFinished ?? (() => Promise.resolve()),
      hooks: options.hooks,
      drainTimeoutMs: options.drainTimeoutMs,
    }),
  };
}

Deno.test('shutdown coordinator runs hooks in LIFO registration order', async () => {
  const calls: string[] = [];
  const { controller, coordinator } = createCoordinator({
    hooks: [
      () => {
        calls.push('first');
      },
      () => {
        calls.push('second');
      },
      () => {
        calls.push('third');
      },
    ],
  });

  const report = await coordinator.runShutdown('manual');

  assertEquals(calls, ['third', 'second', 'first']);
  assertEquals(report, {
    reason: 'manual',
    timedOut: false,
    hooks: [{ ok: true }, { ok: true }, { ok: true }],
  });
  assertEquals(controller.signal.aborted, true);
  assertEquals(controller.signal.reason, 'manual');
});

Deno.test('shutdown coordinator captures hook failures and continues', async () => {
  const calls: string[] = [];
  const { coordinator } = createCoordinator({
    hooks: [
      () => {
        calls.push('first');
      },
      () => {
        calls.push('second');
        throw new Error('second failed');
      },
      () => {
        calls.push('third');
      },
    ],
  });

  const report = await coordinator.runShutdown('manual');

  assertEquals(calls, ['third', 'second', 'first']);
  assertObjectMatch(report, {
    reason: 'manual',
    timedOut: false,
    hooks: [{ ok: true }, { ok: false, error: 'second failed' }, { ok: true }],
  });
});

Deno.test('shutdown coordinator is idempotent and runs hooks once', async () => {
  let hookCalls = 0;
  const { coordinator } = createCoordinator({
    hooks: [() => {
      hookCalls += 1;
    }],
  });

  const first = await coordinator.runShutdown('manual');
  const second = await coordinator.runShutdown('signal', 'SIGTERM');

  assertStrictEquals(first, second);
  assertEquals(hookCalls, 1);
  assertEquals(first.reason, 'manual');
});

Deno.test('shutdown coordinator reports hook timeout without hanging', async () => {
  const { coordinator } = createCoordinator({
    hooks: [() => new Promise<void>(() => {})],
    drainTimeoutMs: 5,
  });

  const report = await coordinator.runShutdown('manual');

  assertEquals(report.reason, 'manual');
  assertEquals(report.timedOut, true);
  assertEquals(report.hooks, [{ ok: false, error: 'shutdown hook timed out' }]);
});
