import type { RuntimeDiagnostic } from './contract.ts';

export const SENDER_OWNERSHIP_SCHEMA_VERSION = '1.0' as const;
export const SENDER_OWNERSHIP_STATES = ['launching', 'active', 'idle'] as const;
export type SenderOwnershipState = typeof SENDER_OWNERSHIP_STATES[number];

export const SENDER_PID_DEBOUNCE_MS = 250 as const;
export const PID_PROBE_STATES = ['alive', 'dead', 'unknown'] as const;
export type PidProbeState = typeof PID_PROBE_STATES[number];

export interface PidLivenessEvidence {
  readonly first: PidProbeState;
  readonly second: PidProbeState;
  readonly elapsedMs: number;
}

export const ROLLOUT_LEASE_STATES = [
  'working',
  'stalled',
  'idle',
  'dead',
  'refused',
  'absent',
  'unknown',
] as const;
export type RolloutLeaseState = typeof ROLLOUT_LEASE_STATES[number];

export const SENDER_SESSION_PROVENANCE_STATES = [
  'matched',
  'mismatched',
  'unknown',
] as const;
export type SenderSessionProvenanceState = typeof SENDER_SESSION_PROVENANCE_STATES[number];

export interface RolloutLeaseEvidence {
  readonly state: RolloutLeaseState;
  readonly provenance: SenderSessionProvenanceState;
  readonly sessionId?: string;
  readonly worktree?: string;
}

export const THREAD_WRITER_STATES = [
  'active',
  'idle',
  'not_loaded',
  'absent',
  'unknown',
] as const;
export type ThreadWriterState = typeof THREAD_WRITER_STATES[number];

export interface ThreadWriterEvidence {
  readonly state: ThreadWriterState;
  readonly provenance: SenderSessionProvenanceState;
  readonly sessionId?: string;
}

export const SENDER_LEASE_STALENESS_STATES = [
  'preserve',
  'stale',
  'indeterminate',
] as const;
export type SenderLeaseStaleness = typeof SENDER_LEASE_STALENESS_STATES[number];

export const SENDER_LEASE_EVICTION_REASONS = ['restart_stale_ownership'] as const;
export type SenderLeaseEvictionReason = typeof SENDER_LEASE_EVICTION_REASONS[number];

export const SENDER_OWNERSHIP_BLOCK_REASONS = [
  'live_owner',
  'ownership_conflict',
  'provenance_unknown',
] as const;
export type SenderOwnershipBlockReason = typeof SENDER_OWNERSHIP_BLOCK_REASONS[number];
export const SENDER_OWNERSHIP_REPAIR_REASONS = ['owner_inactive'] as const;
export type SenderOwnershipRepairReason = typeof SENDER_OWNERSHIP_REPAIR_REASONS[number];

export type SenderOwnershipDiagnostic = RuntimeDiagnostic & {
  readonly ownershipKind: 'blocked' | 'repair-required';
  readonly ownershipReason: SenderOwnershipBlockReason | SenderOwnershipRepairReason;
};

/** Privacy-safe durable owner metadata for one canonical worktree. */
export interface SenderOwnershipRecord {
  readonly schemaVersion: typeof SENDER_OWNERSHIP_SCHEMA_VERSION;
  readonly worktree: string;
  readonly ownerPid: number;
  readonly leaseToken: string;
  readonly state: SenderOwnershipState;
  readonly acquiredAt: string;
  readonly updatedAt: string;
  readonly sessionId?: string;
  /** Exact activation CODEX_HOME. Absent only on backward-compatible legacy records. */
  readonly profileHome?: string;
}

export interface SenderOwnershipObservation {
  readonly record: SenderOwnershipRecord | null;
  readonly ownerProcessAlive: boolean;
  readonly sessionActive: boolean;
}

export interface SenderLeaseStalenessObservation {
  readonly record: SenderOwnershipRecord;
  readonly pid: PidLivenessEvidence;
  readonly rollout: RolloutLeaseEvidence;
  readonly thread: ThreadWriterEvidence;
}

export type SenderOwnershipDecision =
  | { readonly kind: 'available' }
  | {
    readonly kind: 'repair-required';
    readonly reason: SenderOwnershipRepairReason;
    readonly record: SenderOwnershipRecord;
    readonly diagnostic: SenderOwnershipDiagnostic;
  }
  | {
    readonly kind: 'blocked';
    readonly reason: SenderOwnershipBlockReason;
    readonly record: SenderOwnershipRecord;
    readonly diagnostic: SenderOwnershipDiagnostic;
  };

function ownershipDiagnostic(record: SenderOwnershipRecord): SenderOwnershipDiagnostic {
  return {
    code: 'duplicate_sender_risk',
    category: 'safety',
    retryable: false,
    ownershipKind: 'blocked',
    ownershipReason: 'live_owner',
    message: record.sessionId
      ? `worktree already has a sender; resume session ${record.sessionId}`
      : 'worktree already has a sender launch in progress',
    operatorAction: record.sessionId
      ? `resume existing session ${record.sessionId}`
      : `wait for the existing launch owner to publish its session identity or ${
        repairSenderLeaseAction(record.worktree)
      }`,
  };
}

function repairSenderLeaseAction(worktree: string): string {
  return `run deno task agentic:runtime repair sender-lease --worktree ${worktree}`;
}

function repairRequiredDiagnostic(record: SenderOwnershipRecord): SenderOwnershipDiagnostic {
  const repair = repairSenderLeaseAction(record.worktree);
  return {
    code: 'duplicate_sender_risk',
    category: 'safety',
    retryable: false,
    ownershipKind: 'repair-required',
    ownershipReason: 'owner_inactive',
    message: 'worktree has an existing sender lease that launch will not evict',
    operatorAction: record.sessionId
      ? `resume existing session ${record.sessionId} or ${repair}`
      : repair,
  };
}

function provenanceUnknownDiagnostic(record: SenderOwnershipRecord): SenderOwnershipDiagnostic {
  return {
    code: 'ownership_conflict',
    category: 'safety',
    retryable: false,
    ownershipKind: 'blocked',
    ownershipReason: 'provenance_unknown',
    message: 'sender lease lacks activation-profile provenance and cannot be classified safely',
    operatorAction:
      `inspect the sender record for its original CODEX_HOME; do not repair or relaunch ${record.worktree} until provenance is established`,
  };
}

/** Classifies durable ownership without treating elapsed time as proof of staleness. */
export function decideSenderOwnership(
  worktree: string,
  observation: SenderOwnershipObservation,
): SenderOwnershipDecision {
  const record = observation.record;
  if (!record) return { kind: 'available' };
  if (record.worktree !== worktree) {
    return {
      kind: 'blocked',
      reason: 'ownership_conflict',
      record,
      diagnostic: {
        code: 'ownership_conflict',
        category: 'safety',
        retryable: false,
        ownershipKind: 'blocked',
        ownershipReason: 'ownership_conflict',
        message: 'sender ownership record names a different worktree',
        operatorAction: record.sessionId
          ? `resume existing session ${record.sessionId}`
          : repairSenderLeaseAction(worktree),
      },
    };
  }
  if (observation.ownerProcessAlive || observation.sessionActive) {
    return {
      kind: 'blocked',
      reason: 'live_owner',
      record,
      diagnostic: ownershipDiagnostic(record),
    };
  }
  if (!record.profileHome) {
    return {
      kind: 'blocked',
      reason: 'provenance_unknown',
      record,
      diagnostic: provenanceUnknownDiagnostic(record),
    };
  }
  return {
    kind: 'repair-required',
    reason: 'owner_inactive',
    record,
    diagnostic: repairRequiredDiagnostic(record),
  };
}

/** Classifies whether three provenance-bound signals can authorize explicit lease repair. */
export function classifySenderLeaseStaleness(
  worktree: string,
  observation: SenderLeaseStalenessObservation,
): SenderLeaseStaleness {
  const { record, pid, rollout, thread } = observation;
  if (record.worktree !== worktree || !record.sessionId) return 'indeterminate';

  const rolloutIdentityMismatch =
    (rollout.sessionId !== undefined && rollout.sessionId !== record.sessionId) ||
    (rollout.worktree !== undefined && rollout.worktree !== record.worktree);
  const threadIdentityMismatch = thread.sessionId !== undefined &&
    thread.sessionId !== record.sessionId;
  if (rolloutIdentityMismatch || threadIdentityMismatch) return 'indeterminate';

  if (
    pid.first === 'alive' || pid.second === 'alive' ||
    rollout.state === 'working' || rollout.state === 'stalled' ||
    thread.state === 'active'
  ) {
    return 'preserve';
  }

  if (
    pid.first === 'unknown' || pid.second === 'unknown' ||
    rollout.state === 'unknown' || thread.state === 'unknown' ||
    rollout.provenance !== 'matched' || thread.provenance !== 'matched'
  ) {
    return 'indeterminate';
  }

  const pidDebouncedDead = pid.first === 'dead' && pid.second === 'dead' &&
    Number.isFinite(pid.elapsedMs) && pid.elapsedMs >= SENDER_PID_DEBOUNCE_MS;
  if (!pidDebouncedDead) return 'indeterminate';

  const rolloutTerminal =
    (rollout.state === 'idle' || rollout.state === 'dead' || rollout.state === 'refused') &&
    rollout.sessionId === record.sessionId && rollout.worktree === record.worktree;
  const threadInactive = thread.state === 'idle' || thread.state === 'not_loaded' ||
    thread.state === 'absent';
  if (rolloutTerminal && threadInactive) return 'stale';

  const boundAbsence = rollout.state === 'absent' &&
    (thread.state === 'absent' || thread.state === 'not_loaded');
  return boundAbsence ? 'stale' : 'indeterminate';
}

/** Builds the minimum redacted record persisted before sender process spawn. */
export function newSenderOwnershipRecord(
  input: Readonly<{
    worktree: string;
    ownerPid: number;
    leaseToken: string;
    now: string;
    profileHome?: string;
  }>,
): SenderOwnershipRecord {
  if (
    !input.worktree.startsWith('/') || input.ownerPid <= 0 || !input.leaseToken ||
    (input.profileHome !== undefined && !input.profileHome.startsWith('/'))
  ) {
    throw new Error('sender ownership input invalid');
  }
  return {
    schemaVersion: SENDER_OWNERSHIP_SCHEMA_VERSION,
    worktree: input.worktree,
    ownerPid: input.ownerPid,
    leaseToken: input.leaseToken,
    state: 'launching',
    acquiredAt: input.now,
    updatedAt: input.now,
    ...(input.profileHome ? { profileHome: input.profileHome } : {}),
  };
}

/** Attaches the returned thread identity to the same sender lease. */
export function activateSenderOwnership(
  record: SenderOwnershipRecord,
  leaseToken: string,
  sessionId: string,
  now: string,
): SenderOwnershipRecord {
  if (record.leaseToken !== leaseToken || !sessionId) throw new Error('sender lease mismatch');
  return { ...record, state: 'active', sessionId, updatedAt: now };
}
