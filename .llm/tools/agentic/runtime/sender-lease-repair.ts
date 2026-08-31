import type { RuntimeDiagnostic } from './contract.ts';
import {
  classifySenderLeaseStaleness,
  type SenderLeaseStaleness,
  type SenderLeaseStalenessObservation,
  type SenderOwnershipRecord,
} from './sender-ownership.ts';

export const SENDER_LEASE_EVIDENCE_SCHEMA_VERSION = '1.0' as const;

export interface SenderLeaseEvidencePass {
  readonly observedAt: string;
  readonly pid: SenderLeaseStalenessObservation['pid'];
  readonly rollout: SenderLeaseStalenessObservation['rollout'];
  readonly thread: SenderLeaseStalenessObservation['thread'];
}

export interface SenderLeaseEvictionEvidence {
  readonly schemaVersion: typeof SENDER_LEASE_EVIDENCE_SCHEMA_VERSION;
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

export interface SenderLeaseRepairPort {
  observe(
    worktree: string,
    record: SenderOwnershipRecord,
  ): Promise<SenderLeaseStalenessObservation>;
  persistEvidence(evidence: SenderLeaseEvictionEvidence): Promise<void>;
  evict(worktree: string, leaseToken: string): Promise<void>;
  now(): string;
}

export interface SenderLeaseRepairInput {
  readonly worktree: string;
  readonly record: SenderOwnershipRecord;
  readonly dryRun: boolean;
}

export interface SenderLeaseRepairResult {
  readonly status: 'planned' | 'succeeded' | 'no_change' | 'blocked' | 'failed';
  readonly changed: boolean;
  readonly staleness: SenderLeaseStaleness;
  readonly diagnostics: readonly RuntimeDiagnostic[];
  readonly evidence?: SenderLeaseEvictionEvidence;
}

function diagnostic(
  code: RuntimeDiagnostic['code'],
  category: RuntimeDiagnostic['category'],
  message: string,
): RuntimeDiagnostic {
  return { code, category, retryable: false, message };
}

function pass(
  observation: SenderLeaseStalenessObservation,
  observedAt: string,
): SenderLeaseEvidencePass {
  return {
    observedAt,
    pid: observation.pid,
    rollout: observation.rollout,
    thread: observation.thread,
  };
}

function redact(record: SenderOwnershipRecord): Omit<SenderOwnershipRecord, 'leaseToken'> {
  const { leaseToken: _leaseToken, ...redacted } = record;
  return redacted;
}

function unchangedLease(
  expected: SenderOwnershipRecord,
  observed: SenderOwnershipRecord,
): boolean {
  return observed.worktree === expected.worktree &&
    observed.leaseToken === expected.leaseToken &&
    observed.sessionId === expected.sessionId;
}

function result(
  status: SenderLeaseRepairResult['status'],
  staleness: SenderLeaseStaleness,
  diagnostics: readonly RuntimeDiagnostic[] = [],
  values: Readonly<{
    changed?: boolean;
    evidence?: SenderLeaseEvictionEvidence;
  }> = {},
): SenderLeaseRepairResult {
  return {
    status,
    changed: values.changed ?? false,
    staleness,
    diagnostics,
    ...(values.evidence ? { evidence: values.evidence } : {}),
  };
}

/** Re-observes and audibly evicts only a provenance-bound stale sender lease. */
export async function runSenderLeaseRepair(
  input: SenderLeaseRepairInput,
  port: SenderLeaseRepairPort,
): Promise<SenderLeaseRepairResult> {
  const { worktree, record, dryRun } = input;
  if (record.worktree !== worktree || !record.sessionId) {
    return result('blocked', 'indeterminate', [
      diagnostic(
        'ownership_conflict',
        'safety',
        'sender lease repair requires an exact worktree and session owner',
      ),
    ]);
  }

  let initial: SenderLeaseStalenessObservation;
  try {
    initial = await port.observe(worktree, record);
  } catch {
    return result('blocked', 'indeterminate', [
      diagnostic('probe_failed', 'execution', 'sender lease observation failed closed'),
    ]);
  }
  if (!unchangedLease(record, initial.record)) {
    return result('blocked', 'indeterminate', [
      diagnostic('ownership_conflict', 'safety', 'sender lease changed during observation'),
    ]);
  }
  const initialAt = port.now();
  const initialStaleness = classifySenderLeaseStaleness(worktree, initial);
  if (initialStaleness !== 'stale') {
    return result('blocked', initialStaleness, [
      diagnostic(
        'duplicate_sender_risk',
        'safety',
        'sender lease does not have complete stale ownership evidence',
      ),
    ]);
  }
  if (dryRun) return result('planned', 'stale');

  let apply: SenderLeaseStalenessObservation;
  try {
    apply = await port.observe(worktree, record);
  } catch {
    return result('blocked', 'indeterminate', [
      diagnostic('probe_failed', 'execution', 'sender lease re-observation failed closed'),
    ]);
  }
  if (!unchangedLease(record, apply.record)) {
    return result('blocked', 'indeterminate', [
      diagnostic('ownership_conflict', 'safety', 'sender lease changed before eviction'),
    ]);
  }
  const applyAt = port.now();
  const applyStaleness = classifySenderLeaseStaleness(worktree, apply);
  if (applyStaleness !== 'stale') {
    return result('blocked', applyStaleness, [
      diagnostic(
        'duplicate_sender_risk',
        'safety',
        'sender lease became non-stale before eviction',
      ),
    ]);
  }

  const authorized: SenderLeaseEvictionEvidence = {
    schemaVersion: SENDER_LEASE_EVIDENCE_SCHEMA_VERSION,
    reason: 'restart_stale_ownership',
    worktree,
    sessionId: record.sessionId,
    record: redact(record),
    observations: {
      initial: pass(initial, initialAt),
      apply: pass(apply, applyAt),
    },
    outcome: 'authorized',
  };
  try {
    await port.persistEvidence(authorized);
  } catch {
    return result('failed', 'stale', [
      diagnostic('state_write_failed', 'execution', 'sender lease authorization receipt failed'),
    ]);
  }

  try {
    await port.evict(worktree, record.leaseToken);
  } catch {
    return result('blocked', 'indeterminate', [
      diagnostic('ownership_conflict', 'safety', 'sender lease CAS eviction was refused'),
    ], { evidence: authorized });
  }

  const evicted = { ...authorized, outcome: 'evicted' as const };
  try {
    await port.persistEvidence(evicted);
  } catch {
    return result('failed', 'stale', [
      diagnostic('state_write_failed', 'execution', 'sender lease eviction receipt failed'),
    ], { changed: true, evidence: authorized });
  }
  return result('succeeded', 'stale', [], { changed: true, evidence: evicted });
}
