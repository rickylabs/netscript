import { assertEquals } from 'jsr:@std/assert@^1';

import {
  type ActivationPort,
  DEFAULT_RELEASE_RETENTION,
  type ReleaseHistory,
  type ReleaseId,
  type ReleaseRecord,
  retainReleases,
  rollbackToPrevious,
  selectRollbackTarget,
} from './rollback-convention.ts';

function release(id: string, recordedAt: number, healthy = true): ReleaseRecord {
  return { id, recordedAt, healthy };
}

Deno.test('DEFAULT_RELEASE_RETENTION is 3', () => {
  assertEquals(DEFAULT_RELEASE_RETENTION, 3);
});

Deno.test('retainReleases prunes prior releases older than the retention window', () => {
  const history: ReleaseHistory = [
    release('r1', 1),
    release('r2', 2),
    release('r3', 3),
    release('r4', 4),
    release('r5', 5), // current
  ];

  const { retained, pruned } = retainReleases(history, 2);

  // Keep the 2 most-recent prior (r3, r4) + current (r5); prune r1, r2.
  assertEquals(retained.map((r) => r.id), ['r3', 'r4', 'r5']);
  assertEquals(pruned.map((r) => r.id), ['r1', 'r2']);
});

Deno.test('retainReleases never prunes the current release even when keep is 0', () => {
  const history: ReleaseHistory = [release('r1', 1), release('r2', 2)];

  const { retained, pruned } = retainReleases(history, 0);

  assertEquals(retained.map((r) => r.id), ['r2']);
  assertEquals(pruned.map((r) => r.id), ['r1']);
});

Deno.test('retainReleases is a no-op when keep >= prior count', () => {
  const history: ReleaseHistory = [release('r1', 1), release('r2', 2), release('r3', 3)];

  const { retained, pruned } = retainReleases(history, 5);

  assertEquals(retained.map((r) => r.id), ['r1', 'r2', 'r3']);
  assertEquals(pruned, []);
});

Deno.test('selectRollbackTarget picks the most-recent healthy release before current', () => {
  const history: ReleaseHistory = [
    release('r1', 1),
    release('r2', 2),
    release('r3', 3), // current (being rolled back FROM)
  ];

  assertEquals(selectRollbackTarget(history)?.id, 'r2');
});

Deno.test('selectRollbackTarget skips unhealthy prior releases', () => {
  const history: ReleaseHistory = [
    release('r1', 1, true),
    release('r2', 2, false), // failed release, not a rollback target
    release('r3', 3), // current
  ];

  assertEquals(selectRollbackTarget(history)?.id, 'r1');
});

Deno.test('selectRollbackTarget returns undefined for single/empty history', () => {
  assertEquals(selectRollbackTarget([]), undefined);
  assertEquals(selectRollbackTarget([release('r1', 1)]), undefined);
});

/** Fake ActivationPort recording activation calls over a fixed history. */
class FakeActivationPort implements ActivationPort {
  activateCalls: ReleaseId[] = [];
  constructor(private readonly historyFixture: ReleaseHistory) {}
  activate(releaseId: ReleaseId): Promise<void> {
    this.activateCalls.push(releaseId);
    return Promise.resolve();
  }
  current(): Promise<ReleaseId | undefined> {
    const last = this.historyFixture.at(-1);
    return Promise.resolve(last?.id);
  }
  history(): Promise<ReleaseHistory> {
    return Promise.resolve(this.historyFixture);
  }
  record(): Promise<void> {
    return Promise.resolve();
  }
}

Deno.test('rollbackToPrevious activates the previous healthy release', async () => {
  const activation = new FakeActivationPort([
    release('r1', 1),
    release('r2', 2),
    release('r3', 3),
  ]);

  const result = await rollbackToPrevious({ target: 'linux-service' }, activation);

  assertEquals(result.rolledBack, true);
  assertEquals(result.activated, 'r2');
  assertEquals(activation.activateCalls, ['r2']);
});

Deno.test('rollbackToPrevious is a structured no-op when there is nothing to roll back to', async () => {
  const activation = new FakeActivationPort([release('r1', 1)]);

  const result = await rollbackToPrevious({ target: 'linux-service' }, activation);

  assertEquals(result.rolledBack, false);
  assertEquals(result.activated, undefined);
  assertEquals(result.reason, 'no previous healthy release to roll back to');
  assertEquals(activation.activateCalls, []);
});
