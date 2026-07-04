import { assertEquals } from 'jsr:@std/assert@^1';

import { activateWithHealthGate } from './activation-convention.ts';
import type {
  ActivationPort,
  ReleaseHistory,
  ReleaseId,
  ReleaseRecord,
} from './rollback-convention.ts';
import type { HealthProbeOutcome, HealthProbePort, HealthProbeSpec, SleepFn } from './health-gate.ts';

const SPEC: HealthProbeSpec = {
  path: '/health',
  port: 8080,
  timeoutMs: 2000,
  intervalMs: 500,
  retries: 3,
  expectStatus: 200,
};

const noSleep: SleepFn = () => Promise.resolve();

function release(id: string, recordedAt: number, healthy = true): ReleaseRecord {
  return { id, recordedAt, healthy };
}

/** Fake ActivationPort logging an ordered event trace of every port call. */
class FakeActivationPort implements ActivationPort {
  activateCalls: ReleaseId[] = [];
  recordCalls: ReleaseRecord[] = [];
  pruneCalls: (readonly ReleaseId[])[] = [];
  events: string[] = [];
  private currentId: ReleaseId | undefined;
  private historyList: ReleaseRecord[];

  constructor(currentId: ReleaseId | undefined, history: readonly ReleaseRecord[]) {
    this.currentId = currentId;
    this.historyList = [...history];
  }
  activate(releaseId: ReleaseId): Promise<void> {
    this.activateCalls.push(releaseId);
    this.events.push(`activate:${releaseId}`);
    this.currentId = releaseId;
    return Promise.resolve();
  }
  current(): Promise<ReleaseId | undefined> {
    return Promise.resolve(this.currentId);
  }
  history(): Promise<ReleaseHistory> {
    return Promise.resolve(this.historyList);
  }
  record(release: ReleaseRecord): Promise<void> {
    this.recordCalls.push(release);
    this.events.push(`record:${release.id}`);
    this.historyList = [...this.historyList, release];
    return Promise.resolve();
  }
  prune(ids: readonly ReleaseId[]): Promise<void> {
    this.pruneCalls.push(ids);
    this.events.push(`prune:${[...ids].join(',')}`);
    return Promise.resolve();
  }
}

/** Probe that records how many activations happened before its first call. */
class RecordingProbe implements HealthProbePort {
  activateCountAtFirstProbe = -1;
  calls = 0;
  constructor(
    private readonly outcome: HealthProbeOutcome,
    private readonly source: FakeActivationPort,
  ) {}
  probe(): Promise<HealthProbeOutcome> {
    if (this.calls === 0) this.activateCountAtFirstProbe = this.source.activateCalls.length;
    this.calls += 1;
    return Promise.resolve(this.outcome);
  }
}

Deno.test('activateWithHealthGate records the candidate and prunes on a passing gate', async () => {
  const activation = new FakeActivationPort('v1', [
    release('v0', 0),
    release('v1', 1),
  ]);
  const probe = new RecordingProbe({ healthy: true, status: 200 }, activation);

  const result = await activateWithHealthGate(
    { target: 'linux-service', candidate: release('v2', 2, false), spec: SPEC, retain: 1 },
    { activation, health: probe, sleep: noSleep },
  );

  assertEquals(result.activated, true);
  assertEquals(result.release, 'v2');
  // Candidate activated exactly once, then recorded as healthy.
  assertEquals(activation.activateCalls, ['v2']);
  assertEquals(activation.recordCalls.map((r) => r.id), ['v2']);
  assertEquals(activation.recordCalls[0].healthy, true);
  // retain=1 keeps v1 (prior) + v2 (current); v0 pruned.
  assertEquals(result.pruned, ['v0']);
  assertEquals(activation.pruneCalls, [['v0']]);
});

Deno.test('activateWithHealthGate activates the candidate BEFORE probing it', async () => {
  const activation = new FakeActivationPort('v1', [release('v1', 1)]);
  const probe = new RecordingProbe({ healthy: true, status: 200 }, activation);

  await activateWithHealthGate(
    { target: 'linux-service', candidate: release('v2', 2, false), spec: SPEC },
    { activation, health: probe, sleep: noSleep },
  );

  // The candidate was already activated when the first probe ran.
  assertEquals(probe.activateCountAtFirstProbe, 1);
  assertEquals(activation.events[0], 'activate:v2');
});

Deno.test('activateWithHealthGate auto-rolls-back to the prior current on a failing gate', async () => {
  const activation = new FakeActivationPort('v1', [release('v0', 0), release('v1', 1)]);
  const probe = new RecordingProbe({ healthy: false, status: 503 }, activation);

  const result = await activateWithHealthGate(
    { target: 'linux-service', candidate: release('v2', 2, false), spec: SPEC },
    { activation, health: probe, sleep: noSleep },
  );

  assertEquals(result.activated, false);
  assertEquals(result.rolledBackTo, 'v1');
  // Candidate activated, then rolled back to the prior current; never recorded.
  assertEquals(activation.activateCalls, ['v2', 'v1']);
  assertEquals(activation.recordCalls, []);
  assertEquals(activation.pruneCalls, []);
});

Deno.test('activateWithHealthGate on a failing gate with no prior current does not rollback-activate', async () => {
  const activation = new FakeActivationPort(undefined, []);
  const probe = new RecordingProbe({ healthy: false, status: 503 }, activation);

  const result = await activateWithHealthGate(
    { target: 'linux-service', candidate: release('v1', 1, false), spec: SPEC },
    { activation, health: probe, sleep: noSleep },
  );

  assertEquals(result.activated, false);
  assertEquals(result.rolledBackTo, undefined);
  // Only the candidate activation; no rollback target to activate.
  assertEquals(activation.activateCalls, ['v1']);
});
