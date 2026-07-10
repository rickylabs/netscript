import type { RuntimeDiagnostic } from './contract.ts';

export const SENDER_OWNERSHIP_SCHEMA_VERSION = '1.0' as const;
export const SENDER_OWNERSHIP_STATES = ['launching', 'active', 'idle'] as const;
export type SenderOwnershipState = typeof SENDER_OWNERSHIP_STATES[number];

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
