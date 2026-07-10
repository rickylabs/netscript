// deno-fmt-ignore-file
import type {
  AgentKind,
  CapabilityState,
  InstallableFoundationComponentId,
  ObservedFoundationComponentId,
  RouteIdentity,
  RuntimeAction,
  RuntimeCommand,
  SessionIdentity,
  StateDirectoryId,
} from './contract.ts';
import {
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
export const RESOURCE_ROLLBACK_STATES = ['pending', 'applied', 'compensated'] as const; export type ResourceRollbackState = typeof RESOURCE_ROLLBACK_STATES[number];
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
export interface OwnedResourceState { readonly resourceId: string; readonly kind: OwnedResourceKind; readonly action: RuntimeAction; readonly beforeFingerprint: string | null; readonly afterFingerprint: string; readonly previous: OwnedResourcePrevious; readonly rollbackState: ResourceRollbackState; readonly legacyInverseUnavailable?: true; }
export type OwnedResourcePrevious = Readonly<{ kind: 'component'; version: string | null }> | Readonly<{ kind: 'state-directory'; present: boolean }> | Readonly<{ kind: 'desired-state'; desired: DesiredRuntimeState | null }> | Readonly<{ kind: 'route'; route: RouteIdentity }>;
export interface RuntimeCheckpointState {
  readonly schemaVersion: typeof RUNTIME_SCHEMA_VERSION;
  readonly checkpointId: string;
  readonly commandId: string;
  readonly createdAt: string;
  readonly status: CheckpointStatus;
  readonly resources: readonly OwnedResourceState[];
  readonly previousControllerState: PersistedRuntimeState | null;
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
/** Produces a bounded SHA-256 fingerprint of canonical value-free runtime metadata. */
export async function fingerprintRuntimeValue(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(canonicalize(value)));
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return `sha256:${[...digest].map((entry) => entry.toString(16).padStart(2, '0')).join('')}`;
}
function previousFor(
  action: RuntimeAction,
  command: RuntimeCommand,
  observed: ObservedRuntimeState,
  persisted: PersistedRuntimeState | null,
): OwnedResourcePrevious | null {
  if (action.component) {
    const version = observed.components.find((entry) =>
      entry.component === action.component
    )?.version ?? null;
    return { kind: 'component', version };
  }
  if (action.stateDirectory) {
    const present = observed.stateDirectories.includes(action.stateDirectory);
    return { kind: 'state-directory', present };
  }
  if (action.kind === 'persist_desired_state') {
    return { kind: 'desired-state', desired: persisted?.desired ?? null };
  }
  if (action.kind === 'switch_route' || action.kind === 'restore_route') {
    if (command.kind !== 'fallback' && command.kind !== 'restore') return null;
    return { kind: 'route', route: command.currentRoute };
  }
  return null;
}
function targetFor(
  action: RuntimeAction,
  desired: DesiredRuntimeState | null,
): OwnedResourcePrevious | null {
  if (action.component) return { kind: 'component', version: action.targetVersion ?? null };
  if (action.stateDirectory) return { kind: 'state-directory', present: true };
  if (action.kind === 'persist_desired_state') return { kind: 'desired-state', desired };
  if (action.route) return { kind: 'route', route: action.route };
  return null;
}
export async function createRuntimeCheckpoint(
  command: RuntimeCommand,
  createdAt: string,
  actions: readonly RuntimeAction[],
  persisted: PersistedRuntimeState | null,
  desired: DesiredRuntimeState | null,
  observed: ObservedRuntimeState,
  beforeFingerprints: ReadonlyMap<string, string | null>,
): Promise<RuntimeCheckpointState | null> {
  const resources: OwnedResourceState[] = [];
  for (const action of actions) {
    if (!action.reversible || action.resourceIds.length !== 1) return null;
    const previous = previousFor(action, command, observed, persisted);
    const target = targetFor(action, desired);
    if (!previous || !target) return null;
    const resourceId = action.resourceIds[0];
    const beforeFingerprint = beforeFingerprints.get(resourceId) ?? null;
    if (beforeFingerprint !== await fingerprintRuntimeValue(previous)) return null;
    resources.push({
      resourceId,
      kind: resourceId.startsWith('state-directory:') ? 'directory' : 'configuration',
      action,
      beforeFingerprint,
      afterFingerprint: await fingerprintRuntimeValue(target),
      previous,
      rollbackState: 'pending',
    });
  }
  return {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    checkpointId: `${command.commandId}-checkpoint`,
    commandId: command.commandId,
    createdAt,
    status: 'prepared',
    resources,
    previousControllerState: persisted,
  };
}
export function desiredStatesEqual(
  left: DesiredRuntimeState | null,
  right: DesiredRuntimeState | null,
): boolean {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}
