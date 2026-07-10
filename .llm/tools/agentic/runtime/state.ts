/** Value-free desired, observed, persisted, and checkpoint state contracts. */
import type {
  AdapterKind,
  AgentKind,
  CapabilityState,
  InstallableFoundationComponentId,
  ObservedFoundationComponentId,
  RouteIdentity,
  RuntimeAction,
  SessionIdentity,
  StateDirectoryId,
} from './contract.ts';
import {
  ACTION_KINDS,
  AGENT_KINDS,
  INSTALLABLE_FOUNDATION_COMPONENTS,
  RUNTIME_SCHEMA_VERSION,
} from './contract.ts';
// deno-fmt-ignore
const SUMMARY_KEYS = new Set([
  'schemaVersion', 'stateId', 'foundation', 'versions', 'stateDirectories', 'nativeExt4',
  'agents', 'required', 'authRoute', 'route', 'worktrees', 'sessions', 'path', 'branch',
  'upstream', 'clean', 'agent', 'provider', 'model', 'effort', 'worktree', 'sessionId',
  'mobileRequired', 'boundary', 'components', 'component', 'version', 'status', 'auth',
  'conflictKeys', 'capabilities', 'dirty', 'found', 'mobileState', 'checkpoints',
  'checkpointId', 'commandId', ...AGENT_KINDS, ...INSTALLABLE_FOUNDATION_COMPONENTS,
]);
function safeSummaryClone<T>(value: T): T {
  // deno-fmt-ignore
  return JSON.parse(JSON.stringify(value, (key, entry) =>
    !key || SUMMARY_KEYS.has(key) || /^\d+$/.test(key) ? entry : undefined));
}

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
/** Projects parsed desired state into its bounded result-safe summary. */
export function summarizeDesiredState(
  desired: DesiredRuntimeState | null,
  filter?: RuntimeStateFilter,
): DesiredStateSummary | null {
  if (!desired) return null;
  const { schemaVersion: _, ...summary } = safeSummaryClone(desired);
  const agents = Object.fromEntries(
    Object.entries(summary.agents).filter(([agent, entry]) =>
      (!filter?.agent || agent === filter.agent) &&
      (!filter?.worktree || !entry.route || entry.route.worktree === filter.worktree)
    ),
  ) as DesiredStateSummary['agents'];
  return {
    ...summary,
    agents,
    worktrees: summary.worktrees.filter((entry) =>
      !filter?.worktree || entry.path === filter.worktree
    ),
    sessions: summary.sessions.filter((entry) =>
      (!filter?.agent || entry.agent === filter.agent) &&
      (!filter?.worktree || entry.worktree === filter.worktree) &&
      (!filter?.sessionId || entry.sessionId === filter.sessionId)
    ),
  };
}
/** Projects observations into a bounded result-safe summary with real identity filters. */
export function summarizeObservedState(
  observed: ObservedRuntimeState,
  filter?: RuntimeStateFilter,
): ObservedStateSummary {
  const { schemaVersion: _, configuredDesiredState: __, ...summary } = safeSummaryClone(observed);
  return {
    ...summary,
    auth: summary.auth.filter((entry) => !filter?.agent || entry.agent === filter.agent),
    capabilities: Object.fromEntries(
      Object.entries(summary.capabilities).filter(([agent]) =>
        !filter?.agent || agent === filter.agent
      ),
    ),
    worktrees: summary.worktrees.filter((entry) =>
      !filter?.worktree || entry.path === filter.worktree
    ),
    sessions: summary.sessions.filter((entry) =>
      (!filter?.agent || entry.identity.agent === filter.agent) &&
      (!filter?.worktree || entry.identity.worktree === filter.worktree) &&
      (!filter?.sessionId || entry.identity.sessionId === filter.sessionId)
    ),
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

/** Builds the value-free checkpoint persisted before the first owned action. */
export function createRuntimeCheckpoint(
  commandId: string,
  createdAt: string,
  actions: readonly RuntimeAction[],
): RuntimeCheckpointState {
  return {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    checkpointId: `${commandId}-checkpoint`,
    commandId,
    createdAt,
    status: 'prepared',
    actionIds: actions.map((action) => action.id),
    resources: actions.flatMap((action) =>
      action.resourceIds.map((resourceId) => ({
        resourceId,
        kind: resourceId.startsWith('state-directory:') ? 'directory' : 'configuration',
        fingerprint: action.id,
        previousFingerprint: null,
      }))
    ),
  };
}

function rollbackAdapter(resourceId: string): AdapterKind {
  if (resourceId.startsWith('component:') || resourceId.startsWith('state-directory:')) {
    return 'foundation';
  }
  if (resourceId.startsWith('session:codex:')) return 'codex';
  if (resourceId.startsWith('session:claude:')) return 'claude';
  if (resourceId.startsWith('session:gemini:')) return 'gemini';
  return 'state';
}

/** Reconstructs only controller-owned reversible action identities from a strict checkpoint. */
export function checkpointRollbackActions(
  checkpoint: RuntimeCheckpointState,
): RuntimeAction[] | null {
  if (!checkpoint.actionIds.length || checkpoint.actionIds.length !== checkpoint.resources.length) {
    return null;
  }
  if (
    new Set(checkpoint.actionIds).size !== checkpoint.actionIds.length ||
    new Set(checkpoint.resources.map((entry) => entry.resourceId)).size !==
      checkpoint.resources.length
  ) return null;
  const actions: RuntimeAction[] = [];
  for (const [index, id] of checkpoint.actionIds.entries()) {
    const kind = ACTION_KINDS.find((entry) => entry === id.split(':').at(-1));
    const resourceId = checkpoint.resources[index].resourceId;
    if (
      !kind || kind === 'blocked_intent' ||
      !/^(component|state-directory|state|session):[^/\\]+$/.test(resourceId) ||
      checkpoint.resources[index].fingerprint !== id
    ) return null;
    actions.push({
      id,
      kind,
      adapter: rollbackAdapter(resourceId),
      effect: 'write',
      reversible: true,
      resourceIds: [resourceId],
    });
  }
  return actions;
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
