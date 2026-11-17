import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import {
  drainWorker,
  resolveWorkerDrainBudget,
  type WorkerDrainClock,
} from '../../src/shutdown/mod.ts';

class ManualDrainClock implements WorkerDrainClock {
  time = 0;
  timers = new Set<{ at: number; callback: () => void }>();
  now(): number {
    return this.time;
  }
  schedule(ms: number, callback: () => void): () => void {
    const timer = { at: this.time + ms, callback };
    this.timers.add(timer);
    return () => {
      this.timers.delete(timer);
    };
  }
  advance(ms: number): void {
    this.time += ms;
    for (const timer of this.timers) {
      if (timer.at <= this.time) {
        this.timers.delete(timer);
        timer.callback();
      }
    }
  }
}

const turn = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};

Deno.test('worker total budget derives work, cleanup and settlement before allocating resources', () => {
  assertEquals(resolveWorkerDrainBudget(), {
    totalMs: 25_000,
    abortGracePeriodMs: 5_000,
    settlementMs: 1_000,
    workMs: 19_000,
  });
  assertEquals(resolveWorkerDrainBudget({ drainTimeoutMs: 100 }), {
    totalMs: 100,
    abortGracePeriodMs: 20,
    settlementMs: 4,
    workMs: 76,
  });
  for (const drainTimeoutMs of [0, -1, NaN, Infinity, 1.5, 2_147_483_648]) {
    assertThrows(() => resolveWorkerDrainBudget({ drainTimeoutMs }), RangeError);
  }
  for (const abortGracePeriodMs of [-1, NaN, Infinity, 1.5, 101]) {
    assertThrows(
      () => resolveWorkerDrainBudget({ drainTimeoutMs: 100, abortGracePeriodMs }),
      RangeError,
    );
  }
});

Deno.test('worker work that finishes inside the window is not aborted while running', async () => {
  const clock = new ManualDrainClock();
  const work = Promise.withResolvers<void>();
  let aborted = false;
  let closed = false;
  const done = drainWorker({ drainClock: clock }, {
    pauseIntake: () => work.promise,
    abort: () => {
      aborted = true;
    },
    abortCompleted: () => Promise.resolve(),
    close: () => {
      closed = true;
      return Promise.resolve();
    },
  });
  clock.advance(18_999);
  await turn();
  assertEquals(aborted, false);
  work.resolve();
  await done;
  assertEquals(aborted, true);
  assertEquals(closed, true);
  assertEquals(clock.timers.size, 0);
});

Deno.test('worker abort and close share the original total deadline, disposing every timer', async () => {
  const clock = new ManualDrainClock();
  const pending = Promise.withResolvers<void>();
  let aborted = false;
  let closing = false;
  const done = drainWorker({ drainClock: clock }, {
    pauseIntake: () => pending.promise,
    abort: () => {
      aborted = true;
    },
    abortCompleted: () => pending.promise,
    close: () => {
      closing = true;
      return pending.promise;
    },
  });
  const rejection = assertRejects(() => done, DOMException, 'Worker drain budget elapsed.');
  clock.advance(19_000);
  await turn();
  assertEquals(aborted, true);
  assertEquals(closing, false);
  clock.advance(5_000);
  await turn();
  assertEquals(closing, true);
  clock.advance(1_000);
  await rejection;
  assertEquals(clock.timers.size, 0);
  pending.resolve();
});
