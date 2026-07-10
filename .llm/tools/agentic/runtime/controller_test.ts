import {
  buildDoctorReport,
  classifyAuth,
  classifyMobileControl,
  RUNTIME_COMPONENT_IDS,
} from '../wsl-foundation-lib.ts';
import {
  FoundationRuntimeInspector,
  translateFoundationReport,
} from './adapters/foundation-adapter.ts';
import { LocalRuntimeStateAdapter } from './adapters/local-state-adapter.ts';
import type {
  RouteIdentity,
  RuntimeAction,
  RuntimeCommand,
  RuntimeDiagnostic,
} from './contract.ts';
import { RUNTIME_SCHEMA_VERSION } from './contract.ts';
import { applyRuntimeCommand, runRuntimeCommand } from './controller.ts';
import { renderRuntimeHuman, renderRuntimeJson } from './output.ts';
import type { RuntimeMutationPorts, RuntimeReadPorts } from './ports.ts';
import type {
  DesiredRuntimeState,
  ObservedRuntimeState,
  PersistedRuntimeState,
  RuntimeCheckpointState,
} from './state.ts';

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
function equal(actual: unknown, expected: unknown, message = 'values differ'): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message}\nactual: ${JSON.stringify(actual)}\nexpected: ${JSON.stringify(expected)}`,
    );
  }
}
async function treeHash(root: string): Promise<string> {
  const entries = [];
  for await (const entry of Deno.readDir(root)) {
    entries.push([
      entry.name,
      entry.isFile ? await Deno.readTextFile(`${root}/${entry.name}`) : '/',
    ]);
  }
  entries.sort(([left], [right]) => left.localeCompare(right));
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(entries)),
  );
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}
const worktree = '/home/codex/repos/worktree';
const route: RouteIdentity = {
  agent: 'codex',
  provider: 'openai',
  model: 'caller-model',
  effort: 'high',
  worktree,
  mobileRequired: true,
};
const desired: DesiredRuntimeState = {
  schemaVersion: RUNTIME_SCHEMA_VERSION,
  stateId: 'desired-s4',
  foundation: { nativeExt4: true, versions: { node: '2.0.0' }, stateDirectories: ['codex'] },
  agents: { codex: { required: true, authRoute: 'provider-native', route } },
  worktrees: [{ path: worktree, branch: 'feature', upstream: 'none', clean: true }],
  sessions: [],
};
const observed: ObservedRuntimeState = {
  schemaVersion: RUNTIME_SCHEMA_VERSION,
  stateId: 'observed-s4',
  nativeExt4: true,
  components: [{ component: 'node', version: '1.0.0', status: 'outdated' }],
  auth: [],
  stateDirectories: [],
  capabilities: { codex: 'available' },
  worktrees: [{
    path: worktree,
    branch: 'feature',
    upstream: null,
    dirty: false,
    nativeExt4: true,
    found: true,
  }],
  sessions: [],
  configuredDesiredState: desired,
  checkpoints: [],
};
const persisted: PersistedRuntimeState = {
  schemaVersion: RUNTIME_SCHEMA_VERSION,
  stateId: 'controller-s4',
  desired,
  checkpointIds: [],
  lastAppliedCommandId: null,
};
const actionFailure = (code: RuntimeDiagnostic['code'] = 'action_failed'): RuntimeDiagnostic => ({
  code,
  category: code === 'compensation_failed' ? 'rollback' : 'execution',
  retryable: false,
  message: 'bounded synthetic failure',
});

interface ScenarioOptions {
  readonly failAction?: number;
  readonly failCompensation?: boolean;
  readonly failCheckpoint?: RuntimeCheckpointState['status'];
}
function scenario(options: ScenarioOptions = {}) {
  const events: string[] = [];
  const checkpoints = new Map<string, RuntimeCheckpointState>();
  let actionCalls = 0;
  const reads: RuntimeReadPorts = {
    inspector: { observeRuntime: () => Promise.resolve(observed) },
    persistedStateReader: {
      readPersistedState: () =>
        Promise.resolve({ ...persisted, checkpointIds: [...checkpoints.keys()] }),
    },
    desiredStateSource: { loadDesiredState: () => Promise.resolve(desired) },
    checkpointReader: { readCheckpoint: (id) => Promise.resolve(checkpoints.get(id) ?? null) },
    contentReader: {
      summarizeContent: (reference) =>
        Promise.resolve({ path: reference.path, bytes: 0, fingerprint: 'sha256:0' }),
    },
    processProbe: {
      probeProcess: (request) =>
        Promise.resolve({ probeId: request.probeId, exitCode: 0, timedOut: false }),
    },
    clock: { now: () => '2026-07-10T00:00:00.000Z' },
  };
  const writes: RuntimeMutationPorts = {
    desiredStateWriter: { writeDesiredState: () => Promise.resolve() },
    checkpointWriter: {
      writeCheckpoint: (checkpoint) => {
        events.push(`checkpoint:${checkpoint.status}`);
        if (options.failCheckpoint === checkpoint.status) throw new Error('checkpoint failure');
        checkpoints.set(checkpoint.checkpointId, structuredClone(checkpoint));
        return Promise.resolve();
      },
    },
    actionExecutor: {
      executeAction: (action) => {
        events.push(`action:${action.id}`);
        actionCalls++;
        return Promise.resolve(actionCalls === options.failAction ? actionFailure() : null);
      },
    },
    actionCompensator: {
      compensateAction: (action) => {
        events.push(`compensate:${action.id}`);
        return Promise.resolve(
          options.failCompensation ? actionFailure('compensation_failed') : null,
        );
      },
    },
  };
  return { reads, writes, events, checkpoints };
}
const bootstrap = (id: string, mode: 'plan' | 'apply' = 'apply'): RuntimeCommand => ({
  kind: 'bootstrap',
  commandId: id,
  mode,
});

Deno.test('foundation and local-state adapters preserve schema, ownership, and mode 0600', async () => {
  const report = buildDoctorReport({
    generatedAt: '2026-07-10T00:00:00.000Z',
    nativePath: { cwd: worktree, nativeExt4: true },
    components: RUNTIME_COMPONENT_IDS.map((component) => ({
      component,
      detectedVersion: component.startsWith('state-') ? null : '1.0.0',
      expected: null,
      status: 'ready',
      detail: 'bounded',
    })),
    auth: classifyAuth(new Set(), true, true),
    mobileControl: classifyMobileControl(true, '0.144.1', '0.144.1'),
  });
  const translated = await translateFoundationReport(report);
  const inspector = new FoundationRuntimeInspector({ readReport: () => Promise.resolve(report) });
  equal((await inspector.observeRuntime()).components.length, 16);
  equal(translated.stateDirectories, ['claude', 'codex', 'gemini', 'netscript-agentic']);
  const root = await Deno.makeTempDir();
  try {
    const local = new LocalRuntimeStateAdapter(`${root}/runtime`, `${root}/foundation.json`);
    await local.writeDesiredState(persisted);
    await local.writeCheckpoint({
      schemaVersion: RUNTIME_SCHEMA_VERSION,
      checkpointId: 'owned',
      commandId: 'x',
      createdAt: 'now',
      status: 'prepared',
      actionIds: [],
      resources: [],
    });
    equal((await Deno.stat(`${root}/runtime/controller-state.json`)).mode! & 0o777, 0o600);
    equal((await Deno.stat(`${root}/runtime/checkpoints/owned.json`)).mode! & 0o777, 0o600);
    equal((await local.readPersistedState())?.desired, desired);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('successful apply checkpoints before ordered actions and finishes applied', async () => {
  const s = scenario();
  const result = await applyRuntimeCommand(bootstrap('success'), s.reads, s.writes);
  equal(result.status, 'succeeded');
  equal(result.changed, true);
  equal(result.actions.map((entry) => entry.status), ['succeeded', 'succeeded']);
  equal(s.events.map((entry) => entry.split(':')[0]), [
    'checkpoint',
    'action',
    'action',
    'checkpoint',
  ]);
  equal(s.events[0], 'checkpoint:prepared');
  equal(s.events.at(-1), 'checkpoint:applied');
  equal(s.checkpoints.get('success-checkpoint')?.status, 'applied');
});

Deno.test('checkpoint refusal and first-action failure execute no completed mutation', async () => {
  const refused = scenario({ failCheckpoint: 'prepared' });
  const before = await applyRuntimeCommand(bootstrap('refused'), refused.reads, refused.writes);
  equal(before.status, 'failed');
  equal(before.changed, false);
  equal(refused.events, ['checkpoint:prepared']);
  const first = scenario({ failAction: 1 });
  const failed = await applyRuntimeCommand(bootstrap('first'), first.reads, first.writes);
  equal(failed.status, 'failed');
  equal(failed.changed, false);
  equal(first.events.map((entry) => entry.split(':')[0]), ['checkpoint', 'action', 'checkpoint']);
  equal(first.checkpoints.get('first-checkpoint')?.status, 'rolled_back');
});

Deno.test('later failure compensates in reverse and reports partial compensation honestly', async () => {
  const full = scenario({ failAction: 2 });
  const rolled = await applyRuntimeCommand(bootstrap('later'), full.reads, full.writes);
  equal(rolled.status, 'failed');
  equal(rolled.changed, false);
  assert(full.events[3].includes(rolled.actions[0].id), 'first action was not compensated');
  equal(full.checkpoints.get('later-checkpoint')?.status, 'rolled_back');
  const partial = scenario({ failAction: 2, failCompensation: true });
  const incomplete = await applyRuntimeCommand(bootstrap('partial'), partial.reads, partial.writes);
  equal(incomplete.status, 'partially_rolled_back');
  equal(incomplete.changed, true);
  equal(partial.checkpoints.get('partial-checkpoint')?.status, 'partial');
});

Deno.test('applied-status failure cannot become success and reverses every completed action', async () => {
  const s = scenario({ failCheckpoint: 'applied' });
  const result = await applyRuntimeCommand(bootstrap('status-write'), s.reads, s.writes);
  equal(result.status, 'failed');
  equal(result.changed, false);
  equal(s.events.map((entry) => entry.split(':')[0]), [
    'checkpoint',
    'action',
    'action',
    'checkpoint',
    'compensate',
    'compensate',
    'checkpoint',
  ]);
  equal(s.checkpoints.get('status-write-checkpoint')?.status, 'rolled_back');
});

Deno.test('explicit rollback is reverse ordered, ownership safe, and idempotent', async () => {
  const s = scenario();
  await applyRuntimeCommand(bootstrap('owned'), s.reads, s.writes);
  s.events.length = 0;
  const command: RuntimeCommand = {
    kind: 'rollback',
    commandId: 'rollback',
    mode: 'apply',
    checkpointId: 'owned-checkpoint',
  };
  const result = await applyRuntimeCommand(command, s.reads, s.writes);
  equal(result.status, 'rolled_back');
  equal(result.changed, true);
  equal(s.events.map((entry) => entry.split(':')[0]), ['compensate', 'compensate', 'checkpoint']);
  assert(s.events[0].includes('create_state_directory'), 'rollback order was not reversed');
  s.events.length = 0;
  const repeated = await applyRuntimeCommand(command, s.reads, s.writes);
  equal(repeated.status, 'no_change');
  equal(repeated.changed, false);
  equal(s.events, []);
});

Deno.test('rollback refuses incomplete, unowned, and irreversible checkpoint identities', async () => {
  for (
    const [name, mutate] of [
      ['incomplete', (cp: RuntimeCheckpointState) => ({ ...cp, status: 'prepared' as const })],
      [
        'unowned',
        (cp: RuntimeCheckpointState) => ({
          ...cp,
          resources: [{ ...cp.resources[0], resourceId: '/user/data' }],
        }),
      ],
      [
        'irreversible',
        (cp: RuntimeCheckpointState) => ({
          ...cp,
          actionIds: ['x:01:blocked_intent'],
          resources: [{ ...cp.resources[0], fingerprint: 'x:01:blocked_intent' }],
        }),
      ],
    ] as const
  ) {
    const s = scenario();
    await applyRuntimeCommand(bootstrap(name), s.reads, s.writes);
    const id = `${name}-checkpoint`;
    s.checkpoints.set(id, mutate(s.checkpoints.get(id)!));
    s.events.length = 0;
    const result = await applyRuntimeCommand(
      { kind: 'rollback', commandId: `rb-${name}`, mode: 'apply', checkpointId: id },
      s.reads,
      s.writes,
    );
    equal(result.status, 'blocked');
    equal(result.changed, false);
    equal(s.events, []);
  }
});

Deno.test('fallback and restore preserve exact caller routes and require idle boundaries', async () => {
  const session = { agent: 'codex', sessionId: 'thread', worktree, boundary: 'idle' } as const;
  const target = { ...route, model: 'caller-fallback' };
  const fallback: RuntimeCommand = {
    kind: 'fallback',
    commandId: 'fallback',
    mode: 'apply',
    session,
    targetRoute: target,
  };
  const s = scenario();
  equal((await applyRuntimeCommand(fallback, s.reads, s.writes)).route, target);
  const active = {
    ...fallback,
    commandId: 'active',
    session: { ...session, boundary: 'active' as const },
  };
  const blocked = await applyRuntimeCommand(active, s.reads, s.writes);
  equal(blocked.status, 'blocked');
  const restore = await applyRuntimeCommand(
    { kind: 'restore', commandId: 'restore', mode: 'apply', session },
    s.reads,
    s.writes,
  );
  equal(restore.route, route);
});

Deno.test('plan matrix is mutation-free and deferred repair remains blocked', async () => {
  const s = scenario();
  const root = await Deno.makeTempDir();
  await Deno.writeTextFile(`${root}/marker`, 'unchanged');
  const before = await treeHash(root);
  const session = { agent: 'codex', sessionId: 'thread', worktree, boundary: 'idle' } as const;
  const commands: RuntimeCommand[] = [
    bootstrap('bootstrap-plan', 'plan'),
    {
      kind: 'configure',
      commandId: 'configure-plan',
      mode: 'plan',
      desiredState: { path: '/desired.json' },
    },
    { kind: 'launch', commandId: 'launch-plan', mode: 'plan', route, content: { path: '/prompt' } },
    {
      kind: 'resume',
      commandId: 'resume-plan',
      mode: 'plan',
      route: { ...route, sessionId: 'thread' },
      session,
      content: { path: '/message' },
    },
    { kind: 'smoke', commandId: 'smoke-plan', mode: 'plan', route, level: 'static' },
    { kind: 'fallback', commandId: 'fallback-plan', mode: 'plan', session, targetRoute: route },
    { kind: 'restore', commandId: 'restore-plan', mode: 'plan', session },
    { kind: 'repair-codex-remote', commandId: 'repair-plan', mode: 'plan', worktree },
    { kind: 'rollback', commandId: 'rollback-plan', mode: 'plan', checkpointId: 'missing' },
  ];
  for (const command of commands) equal((await runRuntimeCommand(command, s.reads)).changed, false);
  equal(s.events, []);
  const repair = await applyRuntimeCommand(
    { kind: 'repair-codex-remote', commandId: 'repair', mode: 'apply', worktree },
    s.reads,
    s.writes,
  );
  equal(repair.status, 'blocked');
  equal(repair.diagnostics[0]?.ownerIssue, 580);
  equal(s.events, []);
  equal(await treeHash(root), before, 'dry-run matrix changed the state tree');
  await Deno.remove(root, { recursive: true });
});
Deno.test('structured failures stay deterministic and sentinels stay out of results', async () => {
  const codes = [
    'auth_required',
    'auth_conflict',
    'component_missing',
    'component_outdated',
    'version_skew',
    'route_conflict',
    'unsafe_worktree',
    'ownership_conflict',
    'active_session',
    'quota_exhausted',
    'rate_limited',
    'provider_unavailable',
    'timeout',
    'process_failed',
    'action_failed',
  ] as const;
  for (const code of codes) {
    const s = scenario({ failAction: 1 });
    s.writes.actionExecutor.executeAction = () => Promise.resolve({ ...actionFailure(), code });
    const result = await applyRuntimeCommand(bootstrap(`failure-${code}`), s.reads, s.writes);
    equal(result.status, 'failed');
    equal(result.diagnostics[0]?.code, code);
  }
  const corrupt = scenario();
  corrupt.reads.persistedStateReader.readPersistedState = () =>
    Promise.reject(new Error('corrupt'));
  const corruptResult = await applyRuntimeCommand(
    bootstrap('corrupt'),
    corrupt.reads,
    corrupt.writes,
  );
  equal(corruptResult.diagnostics[0]?.code, 'state_corrupt');
  const sentinel = 'SYNTHETIC_SECRET_PROMPT_SENTINEL';
  const root = await Deno.makeTempDir();
  try {
    const path = `${root}/desired.json`;
    await Deno.writeTextFile(path, JSON.stringify({ ...desired, promptContent: sentinel }));
    const local = new LocalRuntimeStateAdapter(`${root}/runtime`, `${root}/foundation.json`);
    const s = scenario();
    const result = await runRuntimeCommand({
      kind: 'configure',
      commandId: 'sentinel',
      mode: 'plan',
      desiredState: { path },
    }, { ...s.reads, desiredStateSource: local });
    assert(
      !`${renderRuntimeJson(result)}${renderRuntimeHuman(result)}`.includes(sentinel),
      'sentinel leaked',
    );
    equal(result.diagnostics[0]?.code, 'invalid_state_file');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
