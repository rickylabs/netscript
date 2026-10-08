import { assert, assertEquals, assertInstanceOf, assertRejects } from '@std/assert';
import {
  InProcessJobRunner,
  type JobContext,
  type JobDefinition,
  type JobRunnerClock,
} from '../../src/runtime/mod.ts';

class ManualClock implements JobRunnerClock {
  time = 10_000;
  readonly timers = new Set<{ at: number; callback: () => void }>();

  now(): number {
    return this.time;
  }

  schedule(delayMs: number, callback: () => void): () => void {
    const timer = { at: this.time + delayMs, callback };
    this.timers.add(timer);
    return () => this.timers.delete(timer);
  }

  advance(ms: number): void {
    this.time += ms;
    for (;;) {
      const timer = [...this.timers].find((timer) => timer.at <= this.time);
      if (!timer) return;
      this.timers.delete(timer);
      timer.callback();
    }
  }
}

function waitingJob(id: string, timeout?: number) {
  const ready = Promise.withResolvers<JobContext>();
  const finish = Promise.withResolvers<void>();
  const job: JobDefinition = {
    id,
    timeout,
    handler: async (context) => {
      ready.resolve(context);
      const aborted = new Promise<void>((resolve) => {
        if (context.signal.aborted) resolve();
        else context.signal.addEventListener('abort', () => resolve(), { once: true });
      });
      await Promise.race([aborted, finish.promise]);
      // A handler that returns success after cancellation must never complete successfully.
      return { success: true };
    },
  };
  return { job, ready: ready.promise, finish: () => finish.resolve() };
}

function input(job: JobDefinition, signal?: AbortSignal, deadlineAt?: number) {
  return { id: job.id, job, payload: {}, signal, deadlineAt };
}

function assertCause(error: unknown, name: string): void {
  assertInstanceOf(error, DOMException);
  assertEquals(error.name, name);
}

Deno.test('runner aborts at the job deadline, rejects false success and clears timers', async () => {
  const clock = new ManualClock();
  const runner = new InProcessJobRunner({ clock, abortGracePeriodMs: 5 });
  const waiting = waitingJob('timeout', 30);
  const outcome = runner.dispatch(waiting.job, input(waiting.job)).catch((error: unknown) => error);
  try {
    const context = await waiting.ready;
    assertEquals(context.deadlineAt, 10_030);
    assertInstanceOf(context.signal, AbortSignal);
    clock.advance(29);
    assertEquals(context.signal.aborted, false);
    clock.advance(1);
    assert(context.signal.aborted);
    assertCause(context.signal.reason, 'TimeoutError');
    assertCause(await outcome, 'TimeoutError');
    assertEquals(clock.timers.size, 0);
  } finally {
    waiting.finish();
    await outcome;
    await runner.stop();
  }
});

Deno.test('runner shutdown immediately aborts isolated concurrent handlers and stops admission', async () => {
  const clock = new ManualClock();
  const runner = new InProcessJobRunner({ clock });
  const jobs = [waitingJob('shutdown-a', 100), waitingJob('shutdown-b', 100)];
  const outcomes = jobs.map(({ job }) => runner.dispatch(job, input(job)).catch((e: unknown) => e));
  try {
    const contexts = await Promise.all(jobs.map((job) => job.ready));
    assert(contexts[0].signal !== contexts[1].signal);
    const stopped = runner.stop();
    for (const context of contexts) {
      assert(context.signal.aborted);
      assertCause(context.signal.reason, 'ShutdownError');
    }
    await stopped;
    for (const outcome of outcomes) assertCause(await outcome, 'ShutdownError');
    await assertRejects(() => runner.dispatch(jobs[0].job, input(jobs[0].job)), Error, 'stopped');
    assertEquals(clock.timers.size, 0);
  } finally {
    jobs.forEach((job) => job.finish());
    await Promise.all(outcomes);
    await runner.stop();
  }
});

Deno.test('caller cancellation preserves first cause, earliest deadline and sibling isolation', async () => {
  const clock = new ManualClock();
  const runner = new InProcessJobRunner({ clock });
  const parent = new AbortController();
  const cancelled = waitingJob('cancelled', 100);
  const sibling = waitingJob('sibling');
  const first = runner.dispatch(cancelled.job, input(cancelled.job, parent.signal, 10_010))
    .catch((e: unknown) => e);
  const second = runner.dispatch(sibling.job, input(sibling.job));
  try {
    const [context, other] = await Promise.all([cancelled.ready, sibling.ready]);
    assertEquals(context.deadlineAt, 10_010);
    assertEquals(other.deadlineAt, undefined);
    const reason = new DOMException('Operator cancelled.', 'AbortError');
    parent.abort(reason);
    assert(context.signal.aborted);
    assertEquals(context.signal.reason, reason);
    clock.advance(10);
    assertEquals(context.signal.reason, reason);
    assertEquals(other.signal.aborted, false);
    assertCause(await first, 'AbortError');
    sibling.finish();
    assertEquals(await second, { success: true });
    let calls = 0;
    const never: JobDefinition = {
      id: 'pre-abort',
      handler: () => {
        calls++;
        return { success: true };
      },
    };
    assertCause(
      await runner.dispatch(never, input(never, parent.signal)).catch((e: unknown) => e),
      'AbortError',
    );
    assertCause(
      await runner.dispatch(never, input(never, undefined, clock.now())).catch((e: unknown) => e),
      'TimeoutError',
    );
    assertEquals(calls, 0);
    await assertRejects(() => runner.dispatch({ ...never, timeout: -1 }, input(never)), RangeError);
    await assertRejects(() => runner.dispatch(never, input(never, undefined, NaN)), RangeError);
    assertEquals(clock.timers.size, 0);
  } finally {
    cancelled.finish();
    sibling.finish();
    await Promise.allSettled([first, second]);
    await runner.stop();
  }
});

Deno.test('noncooperative handler drains only through grace and cannot report progress after abort', async () => {
  const clock = new ManualClock();
  const runner = new InProcessJobRunner({ clock, abortGracePeriodMs: 5 });
  const ready = Promise.withResolvers<JobContext>();
  const finish = Promise.withResolvers<void>();
  const job: JobDefinition = {
    id: 'noncooperative',
    handler: async (context) => {
      ready.resolve(context);
      await finish.promise;
      return { success: true };
    },
  };
  let settled = false;
  let progressCalls = 0;
  const outcome = runner.dispatch(job, {
    ...input(job),
    reportProgress: () => {
      progressCalls++;
    },
  }).catch((e: unknown) => e).then((value) => {
    settled = true;
    return value;
  });
  try {
    const context = await ready.promise;
    const stopped = runner.stop();
    assertCause(context.signal.reason, 'ShutdownError');
    await assertRejects(async () => await context.reportProgress?.(50), DOMException);
    assertEquals(progressCalls, 0);
    clock.advance(4);
    await Promise.resolve();
    assertEquals(settled, false);
    clock.advance(1);
    // Flush the race's promise continuations; assert before awaiting so a mutation cannot hang.
    for (let n = 0; n < 12; n++) await Promise.resolve();
    assert(settled);
    assertCause(await outcome, 'ShutdownError');
    await stopped;
    assertEquals(clock.timers.size, 0);
    finish.resolve();
    assertCause(await outcome, 'ShutdownError');
  } finally {
    finish.resolve();
    await outcome;
    await runner.stop();
  }
});
