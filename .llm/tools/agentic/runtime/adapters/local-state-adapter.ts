// deno-fmt-ignore-file
import { ACTION_EFFECTS, ACTION_KINDS, ADAPTER_KINDS, AGENT_KINDS, type AgentKind, type ContentReference, EFFORTS, INSTALLABLE_FOUNDATION_COMPONENTS, PROVIDER_KINDS, RUNTIME_SCHEMA_VERSION, type RuntimeAction, STATE_DIRECTORY_IDS } from '../contract.ts';
import type {
  CheckpointReaderPort,
  CheckpointWriterPort,
  ContentReaderPort,
  ContentReferenceSummary,
  DesiredStateSourcePort,
  DesiredStateWriterPort,
  OwnedResourceReaderPort,
  PersistedStateReaderPort,
} from '../ports.ts';
import {
  type DesiredAgentState,
  type DesiredRuntimeState,
  fingerprintRuntimeValue,
  type PersistedRuntimeState,
  RESOURCE_ROLLBACK_STATES,
  type RuntimeCheckpointState,
} from '../state.ts';
import { MAX_ROUTING_HISTORY, RESTORATION_STATUSES, ROUTING_CANARY_STATUSES, ROUTING_PHASES, type RoutingState } from '../routing-state-machine.ts';
import { ROUTING_REASON_CATEGORIES } from '../routing-signal-classifier.ts';
export const CONTROLLER_STATE_FILE = 'controller-state.json';
export const CHECKPOINTS_DIRECTORY = 'checkpoints';
type JsonObject = Record<string, unknown>;
function object(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} invalid`);
  }
  return value as JsonObject;
}
function known(value: JsonObject, keys: string, label: string, strict: boolean): void {
  const allowed = new Set(keys.split(' '));
  if (strict && Object.keys(value).some((key) => !allowed.has(key))) {
    throw new Error(`${label} contains unknown field`);
  }
}
function string(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} invalid`);
  return value;
}
function boolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${label} invalid`);
  return value;
}
function array(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} invalid`);
  return value;
}
function member<T extends readonly unknown[]>(value: unknown, values: T, label: string): T[number] {
  if (!values.includes(value)) throw new Error(`${label} invalid`);
  return value as T[number];
}
function parseRoute(value: unknown, strict: boolean) {
  const route = object(value, 'route');
  known(route, 'agent provider profileId baseUrl model effort worktree sessionId mobileRequired', 'route', strict);
  return {
    agent: member(route.agent === 'gemini' ? 'antigravity' : route.agent, AGENT_KINDS, 'route agent'),
    provider: member(route.provider, PROVIDER_KINDS, 'route provider'),
    ...(route.profileId === undefined ? {} : { profileId: string(route.profileId, 'route profile id') as import('../provider-profiles.ts').ProviderProfileId }),
    ...(route.baseUrl === undefined ? {} : { baseUrl: string(route.baseUrl, 'route base URL') }),
    model: string(route.model, 'route model'),
    effort: member(route.effort, EFFORTS, 'route effort'),
    worktree: string(route.worktree, 'route worktree'),
    ...(route.sessionId === undefined ? {} : { sessionId: string(route.sessionId, 'session id') }),
    mobileRequired: boolean(route.mobileRequired, 'mobile requirement'),
  };
}
function parseSession(value: unknown, strict: boolean) {
  const session = object(value, 'session');
  known(session, 'agent sessionId worktree boundary', 'session', strict);
  return {
    agent: member(session.agent === 'gemini' ? 'antigravity' : session.agent, AGENT_KINDS, 'session agent'),
    sessionId: string(session.sessionId, 'session id'),
    worktree: string(session.worktree, 'session worktree'),
    boundary: member(session.boundary, ['active', 'idle', 'new'] as const, 'session boundary'),
  };
}
export function parseDesiredRuntimeState(value: unknown, strict = true): DesiredRuntimeState {
  const state = object(value, 'desired state');
  // deno-fmt-ignore
  known(state, 'schemaVersion stateId foundation agents worktrees sessions', 'desired state', strict);
  if (state.schemaVersion !== RUNTIME_SCHEMA_VERSION) throw new Error('desired schema unsupported');
  const foundation = object(state.foundation, 'foundation');
  known(foundation, 'nativeExt4 versions stateDirectories', 'foundation', strict);
  if (foundation.nativeExt4 !== true) throw new Error('native ext4 requirement invalid');
  const rawVersions = object(foundation.versions, 'foundation versions');
  known(rawVersions, `${INSTALLABLE_FOUNDATION_COMPONENTS.join(' ')} gemini`, 'foundation versions', strict);
  if (rawVersions.gemini !== undefined && rawVersions.antigravity !== undefined) throw new Error('ambiguous legacy Gemini desired version');
  const versions: Record<string, string> = {};
  for (const component of INSTALLABLE_FOUNDATION_COMPONENTS) {
    if (rawVersions[component] !== undefined) {
      versions[component] = string(rawVersions[component], `${component} version`);
    }
  }
  if (rawVersions.gemini !== undefined) versions.antigravity = string(rawVersions.gemini, 'legacy Gemini version');
  const agents: Partial<Record<AgentKind, DesiredAgentState>> = {};
  const rawAgents = object(state.agents, 'agents');
  known(rawAgents, `${AGENT_KINDS.join(' ')} gemini`, 'agents', strict);
  if (rawAgents.gemini !== undefined && rawAgents.antigravity !== undefined) throw new Error('ambiguous legacy Gemini agent state');
  if (rawAgents.gemini !== undefined) rawAgents.antigravity = rawAgents.gemini;
  for (const agent of AGENT_KINDS) {
    if (rawAgents[agent] === undefined) continue;
    const entry = object(rawAgents[agent], `${agent} desired state`);
    known(entry, 'required authRoute route', `${agent} desired state`, strict);
    agents[agent] = {
      required: boolean(entry.required, `${agent} required`),
      authRoute: member(
        entry.authRoute === 'google-subscription' ? 'google-sign-in' : entry.authRoute,
        ['provider-native', 'google-sign-in'] as const,
        `${agent} auth route`,
      ),
      ...(entry.route === undefined ? {} : { route: parseRoute(entry.route, strict) }),
    };
  }
  return {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    stateId: string(state.stateId, 'desired state id'),
    foundation: {
      nativeExt4: true,
      versions,
      stateDirectories: array(foundation.stateDirectories, 'state directories').map((entry) =>
        member(entry === 'gemini' ? 'antigravity' : entry, STATE_DIRECTORY_IDS, 'state directory')
      ),
    },
    agents,
    worktrees: array(state.worktrees, 'worktrees').map((entry) => {
      const worktree = object(entry, 'worktree');
      known(worktree, 'path branch upstream clean', 'worktree', strict);
      if (worktree.upstream !== 'none') throw new Error('worktree upstream invalid');
      return {
        path: string(worktree.path, 'worktree path'),
        branch: string(worktree.branch, 'worktree branch'),
        upstream: 'none' as const,
        clean: boolean(worktree.clean, 'worktree clean'),
      };
    }),
    sessions: array(state.sessions, 'sessions').map((entry) => parseSession(entry, strict)),
  };
}
function parseRoutingState(value: unknown, strict: boolean): RoutingState {
  const state = object(value, 'routing state');
  known(state, 'schemaVersion routingStateId phase desiredRoute activeRoute reasonCategory detectedAt resetAt lastProbeAt nextProbeAt affectedSession fallbackDepth restorationStatus canary notificationRequired transitions', 'routing state', strict);
  if (state.schemaVersion !== RUNTIME_SCHEMA_VERSION) throw new Error('routing schema unsupported');
  const canary = object(state.canary, 'routing canary');
  known(canary, 'status checkedAt diagnosticCode', 'routing canary', strict);
  const transitions = array(state.transitions, 'routing transitions').map((value) => {
    const entry = object(value, 'routing transition');
    known(entry, 'id from to reason occurredAt sessionId fallbackDepth notificationRequired', 'routing transition', strict);
    return { id: string(entry.id, 'transition id'), from: member(entry.from, ROUTING_PHASES, 'transition from'), to: member(entry.to, ROUTING_PHASES, 'transition to'), reason: member(entry.reason, ROUTING_REASON_CATEGORIES, 'transition reason'), occurredAt: string(entry.occurredAt, 'transition time'), sessionId: string(entry.sessionId, 'transition session'), fallbackDepth: Number(entry.fallbackDepth), notificationRequired: boolean(entry.notificationRequired, 'transition notification') };
  });
  if (transitions.length > MAX_ROUTING_HISTORY) throw new Error('routing history exceeds bound');
  return { schemaVersion: RUNTIME_SCHEMA_VERSION, routingStateId: string(state.routingStateId, 'routing state id'), phase: member(state.phase, ROUTING_PHASES, 'routing phase'), desiredRoute: parseRoute(state.desiredRoute, strict), activeRoute: parseRoute(state.activeRoute, strict), reasonCategory: member(state.reasonCategory, ROUTING_REASON_CATEGORIES, 'routing reason'), detectedAt: string(state.detectedAt, 'detected time'), ...(state.resetAt === undefined ? {} : { resetAt: string(state.resetAt, 'reset time') }), ...(state.lastProbeAt === undefined ? {} : { lastProbeAt: string(state.lastProbeAt, 'probe time') }), ...(state.nextProbeAt === undefined ? {} : { nextProbeAt: string(state.nextProbeAt, 'next probe time') }), affectedSession: parseSession(state.affectedSession, strict), fallbackDepth: Number(state.fallbackDepth), restorationStatus: member(state.restorationStatus, RESTORATION_STATUSES, 'restoration status'), canary: { status: member(canary.status, ROUTING_CANARY_STATUSES, 'canary status'), ...(canary.checkedAt === undefined ? {} : { checkedAt: string(canary.checkedAt, 'canary time') }), ...(canary.diagnosticCode === undefined ? {} : { diagnosticCode: string(canary.diagnosticCode, 'canary diagnostic') }) }, notificationRequired: boolean(state.notificationRequired, 'routing notification'), transitions };
}
function parsePersistedRuntimeState(value: unknown, strict = true): PersistedRuntimeState {
  const state = object(value, 'persisted state');
  // deno-fmt-ignore
  known(state, 'schemaVersion stateId desired checkpointIds lastAppliedCommandId routingStates', 'persisted state', strict);
  if (state.schemaVersion !== RUNTIME_SCHEMA_VERSION) {
    throw new Error('persisted schema unsupported');
  }
  return {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    stateId: string(state.stateId, 'controller state id'),
    desired: parseDesiredRuntimeState(state.desired, strict),
    checkpointIds: array(state.checkpointIds, 'checkpoint ids').map((entry) =>
      string(entry, 'checkpoint id')
    ),
    lastAppliedCommandId: state.lastAppliedCommandId === null
      ? null
      : string(state.lastAppliedCommandId, 'last command id'),
    ...(state.routingStates === undefined ? {} : { routingStates: array(state.routingStates, 'routing states').map((entry) => parseRoutingState(entry, strict)) }),
  };
}
function parseAction(value: unknown, strict: boolean): RuntimeAction {
  const action = object(value, 'checkpoint action');
  // deno-fmt-ignore
  known(action, 'id kind adapter effect reversible resourceIds component targetVersion stateDirectory route sessionId stateId checkpointId', 'checkpoint action', strict);
  // deno-fmt-ignore
  return {
    id: string(action.id, 'action id'),
    kind: member(action.kind, ACTION_KINDS, 'action kind'),
    adapter: member(action.adapter, ADAPTER_KINDS, 'action adapter'),
    effect: member(action.effect, ACTION_EFFECTS, 'action effect'),
    reversible: boolean(action.reversible, 'action reversible'),
    resourceIds: array(action.resourceIds, 'action resources').map((entry) => string(entry, 'resource id')),
    ...(action.component === undefined ? {} : { component: member(action.component, INSTALLABLE_FOUNDATION_COMPONENTS, 'component') }),
    ...(action.targetVersion === undefined ? {} : { targetVersion: string(action.targetVersion, 'target version') }),
    ...(action.stateDirectory === undefined ? {} : { stateDirectory: member(action.stateDirectory, STATE_DIRECTORY_IDS, 'state directory') }),
    ...(action.route === undefined ? {} : { route: parseRoute(action.route, strict) }),
    ...(action.sessionId === undefined ? {} : { sessionId: string(action.sessionId, 'session id') }),
    ...(action.stateId === undefined ? {} : { stateId: string(action.stateId, 'state id') }),
    ...(action.checkpointId === undefined ? {} : { checkpointId: string(action.checkpointId, 'checkpoint id') }),
  };
}
function parsePrevious(value: unknown, strict: boolean) {
  const previous = object(value, 'previous owned state');
  known(previous, 'kind version present route desired', 'previous owned state', strict);
  // deno-fmt-ignore
  if (previous.kind === 'component') return { kind: 'component' as const, version: previous.version === null ? null : string(previous.version, 'previous version') };
  // deno-fmt-ignore
  if (previous.kind === 'state-directory') return { kind: 'state-directory' as const, present: boolean(previous.present, 'previous presence') };
  // deno-fmt-ignore
  if (previous.kind === 'desired-state') return { kind: 'desired-state' as const, desired: previous.desired === undefined || previous.desired === null ? null : parseDesiredRuntimeState(previous.desired, strict) };
  // deno-fmt-ignore
  if (previous.kind === 'route') return { kind: 'route' as const, route: parseRoute(previous.route, strict) };
  throw new Error('previous owned state invalid');
}
function parseCheckpoint(value: unknown, strict = true): RuntimeCheckpointState {
  const checkpoint = object(value, 'checkpoint');
  // deno-fmt-ignore
  known(checkpoint, 'schemaVersion checkpointId commandId createdAt status resources previousControllerState', 'checkpoint', strict);
  if (checkpoint.schemaVersion !== RUNTIME_SCHEMA_VERSION) {
    throw new Error('checkpoint schema unsupported');
  }
  const status = member(checkpoint.status, ['prepared', 'applied', 'rolled_back', 'partial'] as const, 'checkpoint status');
  // deno-fmt-ignore
  return {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    checkpointId: string(checkpoint.checkpointId, 'checkpoint id'),
    commandId: string(checkpoint.commandId, 'checkpoint command id'),
    createdAt: string(checkpoint.createdAt, 'checkpoint created time'),
    status,
    resources: array(checkpoint.resources, 'resources').map((entry) => {
      const resource = object(entry, 'resource');
      // deno-fmt-ignore
      known(resource, 'resourceId kind action beforeFingerprint afterFingerprint previous rollbackState legacyInverseUnavailable', 'resource', strict);
      const previousObject = object(resource.previous, 'previous owned state');
      const legacyInverseUnavailable = previousObject.kind === 'desired-state' && !Object.hasOwn(previousObject, 'desired');
      return {
        resourceId: string(resource.resourceId, 'resource id'),
        kind: member(resource.kind, ['directory', 'file', 'symlink', 'configuration'] as const, 'resource kind'),
        action: parseAction(resource.action, strict),
        beforeFingerprint: resource.beforeFingerprint === null ? null : string(resource.beforeFingerprint, 'before fingerprint'),
        afterFingerprint: string(resource.afterFingerprint, 'after fingerprint'),
        previous: parsePrevious(resource.previous, strict),
        rollbackState: resource.rollbackState === undefined ? status === 'rolled_back' ? 'compensated' : status === 'applied' || status === 'partial' ? 'applied' : 'pending' : member(resource.rollbackState, RESOURCE_ROLLBACK_STATES, 'rollback state'),
        ...(legacyInverseUnavailable || resource.legacyInverseUnavailable === true ? { legacyInverseUnavailable: true as const } : {}),
      };
    }),
    previousControllerState: checkpoint.previousControllerState === null ? null : parsePersistedRuntimeState(checkpoint.previousControllerState, strict),
  };
}
function migrateFoundationState(value: unknown): PersistedRuntimeState {
  const state = object(value, 'foundation state');
  if (state.schemaVersion !== RUNTIME_SCHEMA_VERSION) {
    throw new Error('foundation schema unsupported');
  }
  const desired = object(state.desired, 'foundation desired versions');
  if (desired.gemini !== undefined && desired.antigravity !== undefined) throw new Error('ambiguous foundation Google CLI state');
  const antigravity = desired.antigravity ?? desired.gemini;
  return {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    stateId: 'foundation-migration-1.0',
    desired: {
      schemaVersion: RUNTIME_SCHEMA_VERSION,
      stateId: 'foundation-desired-1.0',
      foundation: {
        nativeExt4: true,
        versions: {
          node: string(desired.node, 'node version'),
          claude: string(desired.claude, 'claude version'),
          antigravity: string(antigravity, 'antigravity install channel'),
        },
        stateDirectories: [...STATE_DIRECTORY_IDS],
      },
      agents: {
        claude: { required: true, authRoute: 'provider-native' },
        antigravity: { required: true, authRoute: 'google-sign-in' },
      },
      worktrees: [],
      sessions: [],
    },
    checkpointIds: [],
    lastAppliedCommandId: null,
  };
}
async function readJson(path: string): Promise<unknown | null> {
  try {
    return JSON.parse(await Deno.readTextFile(path));
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return null;
    throw new Error('controller-owned JSON is unreadable or invalid');
  }
}
async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  const separator = path.lastIndexOf('/');
  const directory = path.slice(0, separator);
  await Deno.mkdir(directory, { recursive: true, mode: 0o700 });
  await Deno.chmod(directory, 0o700);
  const temporary = `${path}.netscript-${crypto.randomUUID()}`;
  try {
    await Deno.writeTextFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {
      createNew: true,
      mode: 0o600,
    });
    await Deno.chmod(temporary, 0o600);
    await Deno.rename(temporary, path);
    await Deno.chmod(path, 0o600);
  } catch (error) {
    try {
      await Deno.remove(temporary);
    } catch {
      // The temporary may not have been created.
    }
    throw error;
  }
}
export class LocalRuntimeStateAdapter
  implements
    PersistedStateReaderPort,
    DesiredStateSourcePort,
    CheckpointReaderPort,
    ContentReaderPort,
    OwnedResourceReaderPort,
    DesiredStateWriterPort,
    CheckpointWriterPort {
  constructor(
    private readonly root: string,
    private readonly foundationStatePath: string,
  ) {}
  async readPersistedState(): Promise<PersistedRuntimeState | null> {
    const current = await readJson(`${this.root}/${CONTROLLER_STATE_FILE}`);
    if (current !== null) return parsePersistedRuntimeState(current);
    const foundation = await readJson(this.foundationStatePath);
    return foundation === null ? null : migrateFoundationState(foundation);
  }
  async loadDesiredState(reference: ContentReference): Promise<DesiredRuntimeState> {
    const value = await readJson(reference.path);
    if (value === null) throw new Error('desired state file is missing');
    return parseDesiredRuntimeState(value);
  }
  async readCheckpoint(checkpointId: string): Promise<RuntimeCheckpointState | null> {
    if (!/^[A-Za-z0-9._-]+$/.test(checkpointId)) throw new Error('checkpoint id invalid');
    const value = await readJson(`${this.root}/${CHECKPOINTS_DIRECTORY}/${checkpointId}.json`);
    return value === null ? null : parseCheckpoint(value);
  }
  async summarizeContent(reference: ContentReference): Promise<ContentReferenceSummary> {
    const bytes = await Deno.readFile(reference.path);
    // deno-fmt-ignore
    return { path: reference.path, bytes: bytes.byteLength, fingerprint: await fingerprintRuntimeValue([...bytes]) };
  }
  async writeDesiredState(state: PersistedRuntimeState | null): Promise<void> {
    if (state === null) {
      try {
        await Deno.remove(`${this.root}/${CONTROLLER_STATE_FILE}`);
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      }
      return;
    }
    const path = `${this.root}/${CONTROLLER_STATE_FILE}`;
    await writeJsonAtomic(path, parsePersistedRuntimeState(state, false));
  }
  async readOwnedResourceFingerprint(resourceId: string): Promise<string | null> {
    if (!resourceId.startsWith('state:')) return null;
    const state = await this.readPersistedState();
    return await fingerprintRuntimeValue({
      kind: 'desired-state',
      desired: state?.desired ?? null,
    });
  }
  async writeCheckpoint(checkpoint: RuntimeCheckpointState): Promise<void> {
    const sanitized = parseCheckpoint(checkpoint, false);
    if (!/^[A-Za-z0-9._-]+$/.test(sanitized.checkpointId)) throw new Error('checkpoint id invalid');
    const path = `${this.root}/${CHECKPOINTS_DIRECTORY}/${sanitized.checkpointId}.json`;
    await writeJsonAtomic(path, sanitized);
  }
}
