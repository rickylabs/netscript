import {
  ACTION_EFFECTS,
  ACTION_KINDS,
  ADAPTER_KINDS,
  AGENT_KINDS,
  CAPABILITY_STATES,
  DEFERRED_ISSUES,
  DIAGNOSTIC_CODES,
  EFFORTS,
  FAILURE_CATEGORIES,
  hasLegalRuntimeCommandMode,
  INSTALLABLE_FOUNDATION_COMPONENTS,
  LEGAL_COMMAND_MODES,
  OBSERVED_FOUNDATION_COMPONENTS,
  PROVIDER_KINDS,
  type ReconcilePlan,
  RUNTIME_COMMANDS,
  RUNTIME_MODES,
  RUNTIME_SCHEMA_VERSION,
  RUNTIME_STATUSES,
  type RuntimeCommand,
  type RuntimeResult,
} from './contract.ts';
import { parseDesiredRuntimeState } from './adapters/local-state-adapter.ts';
import { type DesiredStateSourcePort, MUTATION_PORT_METHODS, READ_PORT_METHODS } from './ports.ts';
import type {
  DesiredRuntimeState,
  PersistedRuntimeState,
  RuntimeCheckpointState,
} from './state.ts';
import { RUNTIME_TEST_COMPONENT_VERSIONS } from './test-fixtures.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals(actual: unknown, expected: unknown, message = 'values differ'): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) throw new Error(`${message}\nactual: ${left}\nexpected: ${right}`);
}

function assertUnique(values: readonly unknown[], label: string): void {
  assert(new Set(values).size === values.length, `${label} contains duplicates`);
}

function record(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>;
}

const route = {
  agent: 'codex',
  provider: 'openai',
  model: 'model-id',
  effort: 'medium',
  worktree: '/home/codex/repos/worktree',
  mobileRequired: true,
} as const;

const session = {
  agent: 'codex',
  sessionId: 'session-id',
  worktree: route.worktree,
  boundary: 'idle',
} as const;

// @ts-expect-error doctor is inspect-only by construction.
const illegalDoctorMode: Extract<RuntimeCommand, { kind: 'doctor' }>['mode'] = 'apply';
// @ts-expect-error launch has effects and cannot use inspect mode.
const illegalLaunchMode: Extract<RuntimeCommand, { kind: 'launch' }>['mode'] = 'inspect';

const desired: DesiredRuntimeState = {
  schemaVersion: RUNTIME_SCHEMA_VERSION,
  stateId: 'desired-1',
  foundation: {
    nativeExt4: true,
    versions: RUNTIME_TEST_COMPONENT_VERSIONS,
    stateDirectories: ['claude', 'codex', 'antigravity', 'netscript-agentic'],
  },
  agents: { codex: { required: true, authRoute: 'provider-native', route } },
  worktrees: [{ path: route.worktree, branch: 'feature', upstream: 'none', clean: true }],
  sessions: [session],
};

Deno.test('schema vocabularies are finite and duplicate-free', () => {
  const vocabularies = {
    RUNTIME_COMMANDS,
    RUNTIME_MODES,
    AGENT_KINDS,
    PROVIDER_KINDS,
    EFFORTS,
    OBSERVED_FOUNDATION_COMPONENTS,
    INSTALLABLE_FOUNDATION_COMPONENTS,
    RUNTIME_STATUSES,
    FAILURE_CATEGORIES,
    DIAGNOSTIC_CODES,
    ACTION_EFFECTS,
    ACTION_KINDS,
    ADAPTER_KINDS,
    CAPABILITY_STATES,
    DEFERRED_ISSUES,
  };
  for (const [label, values] of Object.entries(vocabularies)) assertUnique(values, label);
  assertEquals(RUNTIME_SCHEMA_VERSION, '1.0');
});

Deno.test('command union covers the complete schema 1.0 command vocabulary', () => {
  const commands = [
    { kind: 'doctor', commandId: '01', mode: 'inspect' },
    { kind: 'bootstrap', commandId: '02', mode: 'plan' },
    { kind: 'configure', commandId: '03', mode: 'apply', desiredState: { path: '/desired.json' } },
    { kind: 'launch', commandId: '04', mode: 'plan', route, content: { path: '/brief.md' } },
    {
      kind: 'resume',
      commandId: '05',
      mode: 'plan',
      route: { ...route, sessionId: session.sessionId },
      session,
      content: { path: '/follow-up.md' },
    },
    { kind: 'smoke', commandId: '06', mode: 'plan', route, level: 'static' },
    {
      kind: 'fallback',
      commandId: '07',
      mode: 'plan',
      session,
      currentRoute: route,
      targetRoute: route,
    },
    { kind: 'restore', commandId: '08', mode: 'plan', session, currentRoute: route },
    { kind: 'status', commandId: '09', mode: 'inspect', agent: 'codex' },
    { kind: 'repair-codex-remote', commandId: '10', mode: 'plan', worktree: route.worktree },
    { kind: 'rollback', commandId: '11', mode: 'plan', checkpointId: 'checkpoint-1' },
  ] as const satisfies readonly RuntimeCommand[];

  assertEquals(commands.map((command) => command.kind), RUNTIME_COMMANDS);
});

Deno.test('command mode policy rejects illegal combinations at runtime', () => {
  for (const kind of RUNTIME_COMMANDS) {
    const expected = kind === 'doctor' || kind === 'status' ? ['inspect'] : ['plan', 'apply'];
    assertEquals(LEGAL_COMMAND_MODES[kind], expected, `${kind} mode policy differs`);
    for (const mode of RUNTIME_MODES) {
      assertEquals(
        hasLegalRuntimeCommandMode({ kind, mode }),
        expected.includes(mode),
        `${kind}/${mode} legality differs`,
      );
    }
  }
  assert(
    !hasLegalRuntimeCommandMode({ kind: 'doctor', mode: illegalDoctorMode }),
    'doctor/apply accepted',
  );
  assert(
    !hasLegalRuntimeCommandMode({ kind: 'launch', mode: illegalLaunchMode }),
    'launch/inspect accepted',
  );
});

Deno.test('desired-state source loads a value-free state from a content reference', async () => {
  const source: DesiredStateSourcePort = {
    loadDesiredState(reference) {
      assertEquals(reference, { path: '/desired.json' });
      return Promise.resolve(desired);
    },
  };
  const loaded = await source.loadDesiredState({ path: '/desired.json' });
  assertEquals(loaded, desired);
  assert(!('desiredState' in loaded), 'source reference leaked into desired state');
});

Deno.test('persisted and result contracts expose identifiers and fingerprints only', () => {
  const checkpoint: RuntimeCheckpointState = {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    checkpointId: 'checkpoint-1',
    commandId: '03',
    createdAt: '2026-07-10T00:00:00.000Z',
    status: 'prepared',
    resources: [{
      resourceId: 'state:desired-1',
      kind: 'configuration',
      action: {
        id: '03:01:persist_desired_state',
        kind: 'persist_desired_state',
        adapter: 'state',
        effect: 'write',
        reversible: true,
        resourceIds: ['state:desired-1'],
        stateId: 'desired-1',
      },
      beforeFingerprint: 'sha256:old',
      afterFingerprint: 'sha256:new',
      previous: { kind: 'desired-state', desired: null },
      rollbackState: 'pending',
    }],
    previousControllerState: null,
  };
  const persisted: PersistedRuntimeState = {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    stateId: 'controller-1',
    desired,
    checkpointIds: [checkpoint.checkpointId],
    lastAppliedCommandId: '03',
  };
  const result: RuntimeResult = {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    commandId: '03',
    command: 'configure',
    mode: 'apply',
    status: 'succeeded',
    changed: true,
    desiredSummary: {
      stateId: desired.stateId,
      foundation: desired.foundation,
      agents: desired.agents,
      worktrees: desired.worktrees,
      sessions: desired.sessions,
    },
    observedSummary: {
      stateId: 'observed-1',
      nativeExt4: true,
      components: [],
      auth: [],
      stateDirectories: [],
      capabilities: {},
      worktrees: [],
      sessions: [],
      checkpoints: [],
    },
    actions: [{
      id: '03:01:persist_desired_state',
      kind: 'persist_desired_state',
      adapter: 'state',
      effect: 'write',
      reversible: true,
      status: 'succeeded',
    }],
    diagnostics: [],
    route,
    checkpointId: checkpoint.checkpointId,
    timing: {
      startedAt: '2026-07-10T00:00:00.000Z',
      completedAt: '2026-07-10T00:00:00.001Z',
      durationMs: 1,
    },
  };
  const rendered = JSON.stringify({ persisted, checkpoint, result });
  const forbiddenField =
    /"(?:token|password|secret|credential|prompt|message|rawEnv|stdout|stderr)"\s*:/i;
  assert(
    !forbiddenField.test(rendered),
    'a secret/content-bearing field entered a persisted/result contract',
  );
});

Deno.test('read and mutation port vocabularies are disjoint', () => {
  const overlap = READ_PORT_METHODS.filter((method) =>
    (MUTATION_PORT_METHODS as readonly string[]).includes(method)
  );
  assertEquals(overlap, []);
});

Deno.test('reconciliation plans are serializable data, not executable closures', () => {
  const plan: ReconcilePlan = {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    commandId: '10',
    command: 'repair-codex-remote',
    status: 'blocked',
    changed: false,
    actions: [{
      id: '10:01:blocked_intent',
      kind: 'blocked_intent',
      adapter: 'state',
      effect: 'none',
      reversible: false,
      resourceIds: ['worktree:/home/codex/repos/worktree'],
      diagnostic: {
        code: 'capability_deferred',
        category: 'capability',
        retryable: false,
        message: 'live repair is deferred',
        ownerIssue: 581,
      },
    }],
    diagnostics: [],
  };
  const visit = (value: unknown): void => {
    assert(typeof value !== 'function', 'plan contains an executable function');
    if (Array.isArray(value)) { for (const item of value) visit(item); }
    else if (value !== null && typeof value === 'object') {
      for (const item of Object.values(value as Record<string, unknown>)) visit(item);
    }
  };
  visit(plan);
  assert(JSON.parse(JSON.stringify(plan)).actions.length === 1, 'plan did not round-trip as data');
});

Deno.test('strict desired-state vocabulary rejects unknown nested keys', () => {
  const mutations = [
    (value: unknown) => record(value).unknown = true,
    (value: unknown) => record(record(record(value).foundation).versions).deno = '2.9.0',
    (value: unknown) => record(record(value).agents).unknown = {},
    (value: unknown) => record(record(record(record(value).agents).codex).route).unknown = true,
    (value: unknown) => (record(value).worktrees as Record<string, unknown>[])[0].unknown = true,
    (value: unknown) => (record(value).sessions as Record<string, unknown>[])[0].unknown = true,
  ];
  for (const mutate of mutations) {
    const value = structuredClone(desired);
    mutate(value);
    let rejected = false;
    try {
      parseDesiredRuntimeState(value);
    } catch {
      rejected = true;
    }
    assert(rejected, 'unknown desired-state key was accepted');
  }
});
