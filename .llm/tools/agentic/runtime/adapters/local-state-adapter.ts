/** Controller-owned, value-free local state storage with atomic mode-0600 writes. */

import {
  AGENT_KINDS,
  type AgentKind,
  type ContentReference,
  EFFORTS,
  INSTALLABLE_FOUNDATION_COMPONENTS,
  PROVIDER_KINDS,
  RUNTIME_SCHEMA_VERSION,
  STATE_DIRECTORY_IDS,
} from '../contract.ts';
import type {
  CheckpointReaderPort,
  CheckpointWriterPort,
  ContentReaderPort,
  ContentReferenceSummary,
  DesiredStateSourcePort,
  DesiredStateWriterPort,
  PersistedStateReaderPort,
} from '../ports.ts';
import type {
  DesiredAgentState,
  DesiredRuntimeState,
  PersistedRuntimeState,
  RuntimeCheckpointState,
} from '../state.ts';

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
  known(route, 'agent provider model effort worktree sessionId mobileRequired', 'route', strict);
  return {
    agent: member(route.agent, AGENT_KINDS, 'route agent'),
    provider: member(route.provider, PROVIDER_KINDS, 'route provider'),
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
    agent: member(session.agent, AGENT_KINDS, 'session agent'),
    sessionId: string(session.sessionId, 'session id'),
    worktree: string(session.worktree, 'session worktree'),
    boundary: member(session.boundary, ['active', 'idle', 'new'] as const, 'session boundary'),
  };
}

/** Strictly parses an untyped desired-state document; writes use projection mode. */
export function parseDesiredRuntimeState(value: unknown, strict = true): DesiredRuntimeState {
  const state = object(value, 'desired state');
  // deno-fmt-ignore
  known(state, 'schemaVersion stateId foundation agents worktrees sessions', 'desired state', strict);
  if (state.schemaVersion !== RUNTIME_SCHEMA_VERSION) throw new Error('desired schema unsupported');
  const foundation = object(state.foundation, 'foundation');
  known(foundation, 'nativeExt4 versions stateDirectories', 'foundation', strict);
  if (foundation.nativeExt4 !== true) throw new Error('native ext4 requirement invalid');
  const rawVersions = object(foundation.versions, 'foundation versions');
  known(rawVersions, INSTALLABLE_FOUNDATION_COMPONENTS.join(' '), 'foundation versions', strict);
  const versions: Record<string, string> = {};
  for (const component of INSTALLABLE_FOUNDATION_COMPONENTS) {
    if (rawVersions[component] !== undefined) {
      versions[component] = string(rawVersions[component], `${component} version`);
    }
  }
  const agents: Partial<Record<AgentKind, DesiredAgentState>> = {};
  const rawAgents = object(state.agents, 'agents');
  known(rawAgents, AGENT_KINDS.join(' '), 'agents', strict);
  for (const agent of AGENT_KINDS) {
    if (rawAgents[agent] === undefined) continue;
    const entry = object(rawAgents[agent], `${agent} desired state`);
    known(entry, 'required authRoute route', `${agent} desired state`, strict);
    agents[agent] = {
      required: boolean(entry.required, `${agent} required`),
      authRoute: member(
        entry.authRoute,
        ['provider-native', 'google-subscription'] as const,
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
        member(entry, STATE_DIRECTORY_IDS, 'state directory')
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

function parsePersistedRuntimeState(value: unknown, strict = true): PersistedRuntimeState {
  const state = object(value, 'persisted state');
  // deno-fmt-ignore
  known(state, 'schemaVersion stateId desired checkpointIds lastAppliedCommandId', 'persisted state', strict);
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
  };
}

function parseCheckpoint(value: unknown, strict = true): RuntimeCheckpointState {
  const checkpoint = object(value, 'checkpoint');
  // deno-fmt-ignore
  known(checkpoint, 'schemaVersion checkpointId commandId createdAt status actionIds resources', 'checkpoint', strict);
  if (checkpoint.schemaVersion !== RUNTIME_SCHEMA_VERSION) {
    throw new Error('checkpoint schema unsupported');
  }
  return {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    checkpointId: string(checkpoint.checkpointId, 'checkpoint id'),
    commandId: string(checkpoint.commandId, 'checkpoint command id'),
    createdAt: string(checkpoint.createdAt, 'checkpoint created time'),
    status: member(
      checkpoint.status,
      ['prepared', 'applied', 'rolled_back', 'partial'] as const,
      'checkpoint status',
    ),
    actionIds: array(checkpoint.actionIds, 'action ids').map((entry) => string(entry, 'action id')),
    resources: array(checkpoint.resources, 'resources').map((entry) => {
      const resource = object(entry, 'resource');
      // deno-fmt-ignore
      known(resource, 'resourceId kind fingerprint previousFingerprint previousLinkTarget', 'resource', strict);
      const previous = resource.previousFingerprint;
      const link = resource.previousLinkTarget;
      return {
        resourceId: string(resource.resourceId, 'resource id'),
        kind: member(
          resource.kind,
          ['directory', 'file', 'symlink', 'configuration'] as const,
          'resource kind',
        ),
        fingerprint: string(resource.fingerprint, 'fingerprint'),
        previousFingerprint: previous === null ? null : string(previous, 'previous fingerprint'),
        ...(link === undefined ? {} : {
          previousLinkTarget: link === null ? null : string(link, 'previous link target'),
        }),
      };
    }),
  };
}

function migrateFoundationState(value: unknown): PersistedRuntimeState {
  const state = object(value, 'foundation state');
  if (state.schemaVersion !== RUNTIME_SCHEMA_VERSION) {
    throw new Error('foundation schema unsupported');
  }
  const desired = object(state.desired, 'foundation desired versions');
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
          gemini: string(desired.gemini, 'gemini version'),
        },
        stateDirectories: [...STATE_DIRECTORY_IDS],
      },
      agents: {
        claude: { required: true, authRoute: 'provider-native' },
        gemini: { required: true, authRoute: 'google-subscription' },
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

async function fingerprint(bytes: Uint8Array): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', Uint8Array.from(bytes).buffer),
  );
  return `sha256:${[...digest].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

/** Implements controller reads and ownership-scoped atomic state writes. */
export class LocalRuntimeStateAdapter
  implements
    PersistedStateReaderPort,
    DesiredStateSourcePort,
    CheckpointReaderPort,
    ContentReaderPort,
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
    return { path: reference.path, bytes: bytes.byteLength, fingerprint: await fingerprint(bytes) };
  }

  async writeDesiredState(state: PersistedRuntimeState): Promise<void> {
    await writeJsonAtomic(
      `${this.root}/${CONTROLLER_STATE_FILE}`,
      parsePersistedRuntimeState(state, false),
    );
  }

  async writeCheckpoint(checkpoint: RuntimeCheckpointState): Promise<void> {
    const sanitized = parseCheckpoint(checkpoint, false);
    if (!/^[A-Za-z0-9._-]+$/.test(sanitized.checkpointId)) throw new Error('checkpoint id invalid');
    await writeJsonAtomic(
      `${this.root}/${CHECKPOINTS_DIRECTORY}/${sanitized.checkpointId}.json`,
      sanitized,
    );
  }
}
