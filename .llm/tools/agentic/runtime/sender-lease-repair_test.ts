import { assert, assertEquals } from '@std/assert';
import type { SenderLeaseStalenessObservation, SenderOwnershipRecord } from './sender-ownership.ts';

interface SenderLeaseRepairInput {
  readonly worktree: string;
  readonly record: SenderOwnershipRecord;
  readonly dryRun: boolean;
}

interface SenderLeaseEvictionEvidence {
  readonly schemaVersion: string;
  readonly reason: 'restart_stale_ownership';
  readonly worktree: string;
  readonly sessionId: string;
  readonly record: Omit<SenderOwnershipRecord, 'leaseToken'>;
  readonly observations: Readonly<{
    initial: SenderLeaseEvidencePass;
    apply: SenderLeaseEvidencePass;
  }>;
  readonly outcome: 'authorized' | 'evicted';
}

interface SenderLeaseEvidencePass {
  readonly observedAt: string;
  readonly pid: SenderLeaseStalenessObservation['pid'];
  readonly rollout: SenderLeaseStalenessObservation['rollout'];
  readonly thread: SenderLeaseStalenessObservation['thread'];
}

interface SenderLeaseRepairPort {
  observe(
    worktree: string,
    record: SenderOwnershipRecord,
  ): Promise<SenderLeaseStalenessObservation>;
  persistEvidence(evidence: SenderLeaseEvictionEvidence): Promise<void>;
  evict(worktree: string, leaseToken: string): Promise<void>;
  now(): string;
}

interface SenderLeaseRepairResult {
  readonly status: 'planned' | 'succeeded' | 'no_change' | 'blocked' | 'failed';
  readonly changed: boolean;
  readonly staleness: 'preserve' | 'stale' | 'indeterminate';
  readonly evidence?: SenderLeaseEvictionEvidence;
}

interface SenderLeaseRepairModule {
  runSenderLeaseRepair(
    input: SenderLeaseRepairInput,
    port: SenderLeaseRepairPort,
  ): Promise<SenderLeaseRepairResult>;
}

const worktree = '/tmp/netscript-sender-repair/worktree';
const sessionId = '019f4b72-2ea4-7050-917e-6d6918371265';

function record(values: Partial<SenderOwnershipRecord> = {}): SenderOwnershipRecord {
  return {
    schemaVersion: '1.0',
    worktree,
    ownerPid: 91_751,
    leaseToken: 'test-owned-lease-token',
    state: 'active',
    acquiredAt: '2026-08-31T10:00:00.000Z',
    updatedAt: '2026-08-31T10:01:00.000Z',
    sessionId,
    ...values,
  };
}

function staleObservation(
  sender = record(),
  values: Partial<SenderLeaseStalenessObservation> = {},
): SenderLeaseStalenessObservation {
  return {
    record: sender,
    pid: { first: 'dead', second: 'dead', elapsedMs: 250 },
    rollout: {
      state: 'idle',
      provenance: 'matched',
      sessionId: sender.sessionId,
      worktree: sender.worktree,
    },
    thread: { state: 'idle', provenance: 'matched', sessionId: sender.sessionId },
    ...values,
  };
}

async function loadRepairModule(): Promise<SenderLeaseRepairModule> {
  const moduleUrl = new URL('./sender-lease-repair.ts', import.meta.url);
  return await import(moduleUrl.href) as SenderLeaseRepairModule;
}

class FakeRepairPort implements SenderLeaseRepairPort {
  readonly events: string[] = [];
  readonly receipts: SenderLeaseEvictionEvidence[] = [];
  private time = 0;

  constructor(private readonly observations: SenderLeaseStalenessObservation[]) {}

  observe(
    requestedWorktree: string,
    sender: SenderOwnershipRecord,
  ): Promise<SenderLeaseStalenessObservation> {
    this.events.push(`observe:${requestedWorktree}:${sender.leaseToken}`);
    const observation = this.observations.shift();
    if (!observation) throw new Error('test observation exhausted');
    return Promise.resolve(observation);
  }

  persistEvidence(evidence: SenderLeaseEvictionEvidence): Promise<void> {
    this.events.push(`persist:${evidence.outcome}`);
    this.receipts.push(structuredClone(evidence));
    return Promise.resolve();
  }

  evict(requestedWorktree: string, leaseToken: string): Promise<void> {
    this.events.push(`evict:${requestedWorktree}:${leaseToken}`);
    return Promise.resolve();
  }

  now(): string {
    const value = this.time++ === 0 ? '2026-08-31T10:02:00.000Z' : '2026-08-31T10:03:00.000Z';
    return value;
  }
}

function assertNoProductionSenderPath(value: string): void {
  const configuredHome = Deno.env.get('HOME');
  assert(configuredHome, 'HOME must be present so the production sender root can be forbidden');
  const production = `${configuredHome}/.config/netscript-agentic/runtime/senders`;
  assert(!value.startsWith(production), `test path must not use production sender root: ${value}`);
}

Deno.test('restart-stale apply persists both evidence passes before exact-token eviction', async () => {
  assertNoProductionSenderPath(worktree);
  const sender = record();
  const port = new FakeRepairPort([staleObservation(sender), staleObservation(sender)]);
  const { runSenderLeaseRepair } = await loadRepairModule();

  const result = await runSenderLeaseRepair({ worktree, record: sender, dryRun: false }, port);

  assertEquals(result.status, 'succeeded');
  assertEquals(result.changed, true);
  assertEquals(result.staleness, 'stale');
  assertEquals(port.events, [
    `observe:${worktree}:${sender.leaseToken}`,
    `observe:${worktree}:${sender.leaseToken}`,
    'persist:authorized',
    `evict:${worktree}:${sender.leaseToken}`,
    'persist:evicted',
  ]);
  assertEquals(port.receipts.map((entry) => entry.outcome), ['authorized', 'evicted']);
  const receipt = port.receipts.at(-1);
  assert(receipt, 'evicted receipt must be returned');
  assertEquals(receipt.reason, 'restart_stale_ownership');
  assertEquals(receipt.observations.initial.observedAt, '2026-08-31T10:02:00.000Z');
  assertEquals(receipt.observations.apply.observedAt, '2026-08-31T10:03:00.000Z');
  assertEquals(receipt.observations.initial.pid.first, 'dead');
  assertEquals(receipt.observations.apply.thread.state, 'idle');
  assert(!JSON.stringify(receipt).includes(sender.leaseToken), 'receipt leaked the lease token');
});

Deno.test('foreign ownership is a no-op before probing or receipt persistence', async () => {
  assertNoProductionSenderPath(worktree);
  const foreign = record({ worktree: '/tmp/netscript-sender-repair/foreign' });
  const port = new FakeRepairPort([]);
  const { runSenderLeaseRepair } = await loadRepairModule();

  const result = await runSenderLeaseRepair({ worktree, record: foreign, dryRun: false }, port);

  assertEquals(result.status, 'blocked');
  assertEquals(result.changed, false);
  assertEquals(result.staleness, 'indeterminate');
  assertEquals(port.events, []);
  assertEquals(port.receipts, []);
});

Deno.test('unknown evidence is fail-closed with no receipt or eviction', async () => {
  assertNoProductionSenderPath(worktree);
  const sender = record();
  const unknown = staleObservation(sender, {
    pid: { first: 'unknown', second: 'dead', elapsedMs: 250 },
  });
  const port = new FakeRepairPort([unknown]);
  const { runSenderLeaseRepair } = await loadRepairModule();

  const result = await runSenderLeaseRepair({ worktree, record: sender, dryRun: false }, port);

  assertEquals(result.status, 'blocked');
  assertEquals(result.changed, false);
  assertEquals(result.staleness, 'indeterminate');
  assertEquals(port.events, [`observe:${worktree}:${sender.leaseToken}`]);
  assertEquals(port.receipts, []);
});
