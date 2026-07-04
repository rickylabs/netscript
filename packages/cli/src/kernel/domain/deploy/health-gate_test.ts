import { assertEquals } from 'jsr:@std/assert@^1';

import {
  type HealthProbeOutcome,
  type HealthProbePort,
  type HealthProbeSpec,
  runHealthGate,
  type SleepFn,
} from './health-gate.ts';

const SPEC: HealthProbeSpec = {
  path: '/health',
  port: 8080,
  timeoutMs: 2000,
  intervalMs: 500,
  retries: 5,
  expectStatus: 200,
};

/** Probe that returns/throws a scripted sequence of outcomes. */
class ScriptedProbe implements HealthProbePort {
  calls = 0;
  constructor(private readonly script: readonly (HealthProbeOutcome | 'throw')[]) {}
  probe(): Promise<HealthProbeOutcome> {
    const next = this.script[this.calls] ?? this.script[this.script.length - 1];
    this.calls += 1;
    if (next === 'throw') return Promise.reject(new Error('probe timeout'));
    return Promise.resolve(next);
  }
}

/** Deterministic sleep that records the durations it was asked to wait. */
function recordingSleep(): { fn: SleepFn; waited: number[] } {
  const waited: number[] = [];
  const fn: SleepFn = (ms) => {
    waited.push(ms);
    return Promise.resolve();
  };
  return { fn, waited };
}

Deno.test('runHealthGate passes once a probe reports healthy, honoring earlier retries', async () => {
  const probe = new ScriptedProbe([
    { healthy: false, status: 503 },
    { healthy: false, status: 503 },
    { healthy: true, status: 200 },
  ]);
  const sleep = recordingSleep();

  const result = await runHealthGate(SPEC, probe, sleep.fn);

  assertEquals(result.passed, true);
  assertEquals(result.attempts, 3);
  assertEquals(probe.calls, 3);
  // Slept between the two failed attempts only, never after the passing probe.
  assertEquals(sleep.waited, [500, 500]);
});

Deno.test('runHealthGate fails after exhausting retries', async () => {
  const probe = new ScriptedProbe([{ healthy: false, status: 500 }]);
  const sleep = recordingSleep();

  const result = await runHealthGate(SPEC, probe, sleep.fn);

  assertEquals(result.passed, false);
  assertEquals(result.attempts, 5);
  assertEquals(probe.calls, 5);
  // Sleeps between attempts only: retries - 1.
  assertEquals(sleep.waited.length, 4);
});

Deno.test('runHealthGate counts a thrown probe (timeout/transport) as a failed attempt', async () => {
  const probe = new ScriptedProbe(['throw', 'throw', { healthy: true, status: 200 }]);
  const sleep = recordingSleep();

  const result = await runHealthGate(SPEC, probe, sleep.fn);

  assertEquals(result.passed, true);
  assertEquals(result.attempts, 3);
});

Deno.test('runHealthGate makes at least one attempt even when retries < 1', async () => {
  const probe = new ScriptedProbe([{ healthy: false, status: 500 }]);
  const sleep = recordingSleep();

  const result = await runHealthGate({ ...SPEC, retries: 0 }, probe, sleep.fn);

  assertEquals(result.attempts, 1);
  assertEquals(probe.calls, 1);
  assertEquals(sleep.waited, []);
});
