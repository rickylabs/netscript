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
  | { readonly kind: 'stale'; readonly record: SenderOwnershipRecord }
  | {
    readonly kind: 'blocked';
    readonly record: SenderOwnershipRecord;
    readonly diagnostic: RuntimeDiagnostic;
  };

function ownershipDiagnostic(record: SenderOwnershipRecord): RuntimeDiagnostic {
  return {
    code: 'duplicate_sender_risk',
    category: 'safety',
    retryable: false,
    message: record.sessionId
      ? `worktree already has a sender; resume session ${record.sessionId}`
      : 'worktree already has a sender launch in progress',
    operatorAction: record.sessionId
      ? `resume existing session ${record.sessionId}`
      : 'wait for the existing launch owner to publish its session identity',
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
      record,
      diagnostic: {
        code: 'ownership_conflict',
        category: 'safety',
        retryable: false,
        message: 'sender ownership record names a different worktree',
      },
    };
  }
  if (observation.ownerProcessAlive || observation.sessionActive) {
    return { kind: 'blocked', record, diagnostic: ownershipDiagnostic(record) };
  }
  return { kind: 'stale', record };
}

/** Classifies whether three provenance-bound signals can authorize explicit lease repair. */
export function classifySenderLeaseStaleness(
  _worktree: string,
  _observation: SenderLeaseStalenessObservation,
): SenderLeaseStaleness {
  // Slice 1 keeps the new contract fail-closed until Slice 2 implements the locked truth table.
  return 'indeterminate';
}

/** Builds the minimum redacted record persisted before sender process spawn. */
export function newSenderOwnershipRecord(
  input: Readonly<{
    worktree: string;
    ownerPid: number;
    leaseToken: string;
    now: string;
  }>,
): SenderOwnershipRecord {
  if (!input.worktree.startsWith('/') || input.ownerPid <= 0 || !input.leaseToken) {
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
