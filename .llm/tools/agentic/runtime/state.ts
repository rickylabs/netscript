/** Value-free desired, observed, persisted, and checkpoint state contracts. */

import type {
  AgentKind,
  CapabilityState,
  FoundationComponentId,
  RouteIdentity,
  SessionIdentity,
  StateDirectoryId,
} from './contract.ts';
import { RUNTIME_SCHEMA_VERSION } from './contract.ts';

export const COMPONENT_STATUSES = [
  'ready',
  'missing',
  'outdated',
  'version_skew',
  'auth_required',
  'auth_conflict',
  'unavailable',
] as const;
export type ComponentStatus = typeof COMPONENT_STATUSES[number];

export const AUTH_ROUTES = ['provider-native', 'google-subscription'] as const;
export type AuthRoute = typeof AUTH_ROUTES[number];

export const CHECKPOINT_STATUSES = ['prepared', 'applied', 'rolled_back', 'partial'] as const;
export type CheckpointStatus = typeof CHECKPOINT_STATUSES[number];

export const OWNED_RESOURCE_KINDS = ['directory', 'file', 'symlink', 'configuration'] as const;
export type OwnedResourceKind = typeof OWNED_RESOURCE_KINDS[number];

export interface DesiredFoundationState {
  readonly nativeExt4: true;
  readonly versions: Readonly<Partial<Record<FoundationComponentId, string>>>;
  readonly stateDirectories: readonly StateDirectoryId[];
}

export interface DesiredAgentState {
  readonly required: boolean;
  readonly authRoute: AuthRoute;
  readonly route?: RouteIdentity;
}

export interface DesiredWorktreeState {
  readonly path: string;
  readonly branch: string;
  readonly upstream: 'none';
  readonly clean: boolean;
}

export interface DesiredRuntimeState {
  readonly schemaVersion: typeof RUNTIME_SCHEMA_VERSION;
  readonly stateId: string;
  readonly foundation: DesiredFoundationState;
  readonly agents: Readonly<Partial<Record<AgentKind, DesiredAgentState>>>;
  readonly worktrees: readonly DesiredWorktreeState[];
  readonly sessions: readonly SessionIdentity[];
}

export interface ObservedComponentState {
  readonly component: FoundationComponentId;
  readonly version: string | null;
  readonly status: ComponentStatus;
}

export interface ObservedAuthState {
  readonly agent: AgentKind;
  readonly route: AuthRoute;
  readonly status: 'ready' | 'auth_required' | 'auth_conflict';
  readonly conflictKeys: readonly string[];
}

export interface ObservedWorktreeState {
  readonly path: string;
  readonly branch: string;
  readonly upstream: string | null;
  readonly dirty: boolean;
  readonly nativeExt4: boolean;
  readonly found: boolean;
}

export interface ObservedSessionState {
  readonly identity: SessionIdentity;
  readonly mobileState: CapabilityState;
}

export interface CheckpointSummary {
  readonly checkpointId: string;
  readonly commandId: string;
  readonly status: CheckpointStatus;
}

export interface ObservedRuntimeState {
  readonly schemaVersion: typeof RUNTIME_SCHEMA_VERSION;
  readonly stateId: string;
  readonly nativeExt4: boolean;
  readonly components: readonly ObservedComponentState[];
  readonly auth: readonly ObservedAuthState[];
  readonly stateDirectories: readonly StateDirectoryId[];
  readonly capabilities: Readonly<Partial<Record<AgentKind, CapabilityState>>>;
  readonly worktrees: readonly ObservedWorktreeState[];
  readonly sessions: readonly ObservedSessionState[];
  readonly configuredDesiredState: DesiredRuntimeState | null;
  readonly checkpoints: readonly CheckpointSummary[];
}

export interface OwnedResourceState {
  readonly resourceId: string;
  readonly kind: OwnedResourceKind;
  readonly fingerprint: string;
  readonly previousFingerprint: string | null;
  readonly previousLinkTarget?: string | null;
}

export interface RuntimeCheckpointState {
  readonly schemaVersion: typeof RUNTIME_SCHEMA_VERSION;
  readonly checkpointId: string;
  readonly commandId: string;
  readonly createdAt: string;
  readonly status: CheckpointStatus;
  readonly actionIds: readonly string[];
  readonly resources: readonly OwnedResourceState[];
}

export interface PersistedRuntimeState {
  readonly schemaVersion: typeof RUNTIME_SCHEMA_VERSION;
  readonly stateId: string;
  readonly desired: DesiredRuntimeState;
  readonly checkpointIds: readonly string[];
  readonly lastAppliedCommandId: string | null;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)] as const);
    return Object.fromEntries(entries);
  }
  return value;
}

/** Compares desired state deterministically without relying on object key insertion order. */
export function desiredStatesEqual(
  left: DesiredRuntimeState | null,
  right: DesiredRuntimeState | null,
): boolean {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}
