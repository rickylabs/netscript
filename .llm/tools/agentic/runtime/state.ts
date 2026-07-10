/** Value-free desired, observed, persisted, and checkpoint state contracts. */

import type {
  AgentKind,
  CapabilityState,
  InstallableFoundationComponentId,
  ObservedFoundationComponentId,
  RouteIdentity,
  SessionIdentity,
  StateDirectoryId,
} from './contract.ts';
import { AGENT_KINDS, RUNTIME_SCHEMA_VERSION } from './contract.ts';

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
  readonly versions: Readonly<Partial<Record<InstallableFoundationComponentId, string>>>;
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
  readonly component: ObservedFoundationComponentId;
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

export type DesiredStateSummary = Omit<DesiredRuntimeState, 'schemaVersion'>;
export type ObservedStateSummary = Omit<
  ObservedRuntimeState,
  'schemaVersion' | 'configuredDesiredState'
>;

export interface RuntimeStateFilter {
  readonly agent?: AgentKind;
  readonly worktree?: string;
  readonly sessionId?: string;
}

function summarizeRoute(route: RouteIdentity): RouteIdentity {
  return {
    agent: route.agent,
    provider: route.provider,
    model: route.model,
    effort: route.effort,
    worktree: route.worktree,
    ...(route.sessionId ? { sessionId: route.sessionId } : {}),
    mobileRequired: route.mobileRequired,
  };
}

function summarizeSession(session: SessionIdentity): SessionIdentity {
  return {
    agent: session.agent,
    sessionId: session.sessionId,
    worktree: session.worktree,
    boundary: session.boundary,
  };
}

/** Projects parsed desired state into its bounded result-safe summary. */
export function summarizeDesiredState(
  desired: DesiredRuntimeState | null,
  filter?: RuntimeStateFilter,
): DesiredStateSummary | null {
  if (!desired) return null;
  const agents = Object.fromEntries(
    Object.entries(desired.agents).filter(([agent, entry]) =>
      AGENT_KINDS.includes(agent as AgentKind) && (!filter?.agent || agent === filter.agent) &&
      (!filter?.worktree || !entry.route || entry.route.worktree === filter.worktree)
    ).map(([agent, entry]) => [agent, {
      required: entry.required,
      authRoute: entry.authRoute,
      ...(entry.route ? { route: summarizeRoute(entry.route) } : {}),
    }]),
  ) as DesiredStateSummary['agents'];
  return {
    stateId: desired.stateId,
    foundation: {
      nativeExt4: true,
      versions: { ...desired.foundation.versions },
      stateDirectories: [...desired.foundation.stateDirectories],
    },
    agents,
    worktrees: desired.worktrees.filter((entry) =>
      !filter?.worktree || entry.path === filter.worktree
    ).map((entry) => ({
      path: entry.path,
      branch: entry.branch,
      upstream: entry.upstream,
      clean: entry.clean,
    })),
    sessions: desired.sessions.filter((entry) =>
      (!filter?.agent || entry.agent === filter.agent) &&
      (!filter?.worktree || entry.worktree === filter.worktree) &&
      (!filter?.sessionId || entry.sessionId === filter.sessionId)
    ).map(summarizeSession),
  };
}

/** Projects observations into a bounded result-safe summary with real identity filters. */
export function summarizeObservedState(
  observed: ObservedRuntimeState,
  filter?: RuntimeStateFilter,
): ObservedStateSummary {
  return {
    stateId: observed.stateId,
    nativeExt4: observed.nativeExt4,
    components: observed.components.map((entry) => ({
      component: entry.component,
      version: entry.version,
      status: entry.status,
    })),
    auth: observed.auth.filter((entry) =>
      AGENT_KINDS.includes(entry.agent) && (!filter?.agent || entry.agent === filter.agent)
    ).map((entry) => ({
      agent: entry.agent,
      route: entry.route,
      status: entry.status,
      conflictKeys: [...entry.conflictKeys],
    })),
    stateDirectories: [...observed.stateDirectories],
    capabilities: Object.fromEntries(
      Object.entries(observed.capabilities).filter(([agent]) =>
        AGENT_KINDS.includes(agent as AgentKind) && (!filter?.agent || agent === filter.agent)
      ),
    ),
    worktrees: observed.worktrees.filter((entry) =>
      !filter?.worktree || entry.path === filter.worktree
    ).map((entry) => ({
      path: entry.path,
      branch: entry.branch,
      upstream: entry.upstream,
      dirty: entry.dirty,
      nativeExt4: entry.nativeExt4,
      found: entry.found,
    })),
    sessions: observed.sessions.filter((entry) =>
      (!filter?.agent || entry.identity.agent === filter.agent) &&
      (!filter?.worktree || entry.identity.worktree === filter.worktree) &&
      (!filter?.sessionId || entry.identity.sessionId === filter.sessionId)
    ).map((entry) => ({
      identity: summarizeSession(entry.identity),
      mobileState: entry.mobileState,
    })),
    checkpoints: observed.checkpoints.map((entry) => ({
      checkpointId: entry.checkpointId,
      commandId: entry.commandId,
      status: entry.status,
    })),
  };
}

/** Creates the finite result-safe observation used before an inspector succeeds. */
export function unavailableObservedSummary(stateId = 'unavailable'): ObservedStateSummary {
  return {
    stateId,
    nativeExt4: false,
    components: [],
    auth: [],
    stateDirectories: [],
    capabilities: {},
    worktrees: [],
    sessions: [],
    checkpoints: [],
  };
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
