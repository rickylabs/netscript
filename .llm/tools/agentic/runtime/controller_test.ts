import { LocalRuntimeStateAdapter } from './adapters/local-state-adapter.ts';
import type { RouteIdentity, RuntimeCommand, RuntimeDiagnostic } from './contract.ts';
import { RUNTIME_SCHEMA_VERSION } from './contract.ts';
import { applyRuntimeCommand, runRuntimeCommand } from './controller.ts';
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
const worktree = '/home/codex/repos/worktree';
const route: RouteIdentity = {
  agent: 'codex',
  provider: 'openai',
  model: 'primary',
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
const failure = (
  code: RuntimeDiagnostic['code'],
  category: RuntimeDiagnostic['category'] = 'execution',
) => ({ code, category, retryable: false, message: `adapter:${code}` }) as const;

interface Options {
  failAction?: number;
  failCompensation?: boolean;
  failStateWrite?: boolean;
  failCheckpoint?: RuntimeCheckpointState['status'];
}
function scenario(options: Options = {}) {
  const events: string[] = [];
  const compensated: RuntimeCheckpointState['resources'][number][] = [];
  const checkpoints = new Map<string, RuntimeCheckpointState>();
  const fingerprints = new Map<string, string | null>();
  let state: PersistedRuntimeState | null = persisted;
  let actionCalls = 0;
  let observations = 0;
  const reads: RuntimeReadPorts = {
    inspector: {
      observeRuntime: () => {
        observations++;
        return Promise.resolve(observed);
      },
    },
    persistedStateReader: { readPersistedState: () => Promise.resolve(state) },
    desiredStateSource: { loadDesiredState: () => Promise.resolve(desired) },
    checkpointReader: { readCheckpoint: (id) => Promise.resolve(checkpoints.get(id) ?? null) },
    ownedResourceReader: {
      readOwnedResourceFingerprint: (id) => Promise.resolve(fingerprints.get(id) ?? null),
    },
    contentReader: {
      summarizeContent: (value) =>
        Promise.resolve({ path: value.path, bytes: 0, fingerprint: 'sha256:0' }),
    },
    processProbe: {
      probeProcess: (value) =>
        Promise.resolve({ probeId: value.probeId, exitCode: 0, timedOut: false }),
    },
    clock: { now: () => '2026-07-10T00:00:00.000Z' },
  };
  const writes: RuntimeMutationPorts = {
    desiredStateWriter: {
      writeDesiredState: (next) => {
        events.push('state');
        if (options.failStateWrite) throw new Error('state write');
        state = next;
        return Promise.resolve();
      },
    },
    checkpointWriter: {
      writeCheckpoint: (checkpoint) => {
        events.push(`checkpoint:${checkpoint.status}`);
        if (options.failCheckpoint === checkpoint.status) throw new Error('checkpoint write');
        checkpoints.set(checkpoint.checkpointId, structuredClone(checkpoint));
        return Promise.resolve();
      },
    },
    actionExecutor: {
      executeAction: (action) => {
        events.push(`action:${action.id}`);
        actionCalls++;
        if (actionCalls === options.failAction) {
          return Promise.resolve(
            failure('provider_unavailable'),
          );
        }
        const resource = [...checkpoints.values()].at(-1)?.resources.find((entry) =>
          entry.action.id === action.id
        );
        if (resource) fingerprints.set(resource.resourceId, resource.afterFingerprint);
        return Promise.resolve(null);
      },
    },
    actionCompensator: {
      compensateAction: (action, resource) => {
        events.push(`compensate:${action.id}`);
        compensated.push(resource);
        if (options.failCompensation) {
          return Promise.resolve(
            failure('compensation_failed', 'rollback'),
          );
        }
        fingerprints.set(resource.resourceId, resource.beforeFingerprint);
        return Promise.resolve(null);
      },
    },
  };
  return {
    reads,
    writes,
    events,
    checkpoints,
    fingerprints,
    compensated,
    state: () => state,
    observations: () => observations,
  };
}
const bootstrap = (id: string): RuntimeCommand => ({
  kind: 'bootstrap',
  commandId: id,
  mode: 'apply',
});

Deno.test('successful apply persists desired state, checkpoint id, and last command', async () => {
  const s = scenario();
  const result = await applyRuntimeCommand(bootstrap('success'), s.reads, s.writes);
  equal(result.status, 'succeeded');
  equal(result.actions.map((entry) => entry.status), ['succeeded', 'succeeded']);
  equal(s.state()?.checkpointIds, ['success-checkpoint']);
  equal(s.state()?.lastAppliedCommandId, 'success');
  equal(s.checkpoints.get('success-checkpoint')?.status, 'applied');
  equal(s.events.map((entry) => entry.split(':')[0]), [
    'checkpoint',
    'action',
    'action',
    'state',
    'checkpoint',
  ]);
});

Deno.test('configure survives a fresh LocalRuntimeStateAdapter roundtrip', async () => {
  const root = await Deno.makeTempDir();
  try {
    const desiredNext = { ...desired, stateId: 'desired-next' };
    const source = `${root}/desired.json`;
    await Deno.writeTextFile(source, JSON.stringify(desiredNext));
    const local = new LocalRuntimeStateAdapter(`${root}/runtime`, `${root}/foundation.json`);
    await local.writeDesiredState(persisted);
    const s = scenario();
    const reads = {
      ...s.reads,
      persistedStateReader: local,
      desiredStateSource: local,
      checkpointReader: local,
      ownedResourceReader: local,
    };
    const writes = { ...s.writes, desiredStateWriter: local, checkpointWriter: local };
    const command = {
      kind: 'configure',
      commandId: 'configure',
      mode: 'apply',
      desiredState: { path: source },
    } as const;
    const result = await applyRuntimeCommand(command, reads, writes);
    equal(result.status, 'succeeded');
    const fresh = new LocalRuntimeStateAdapter(`${root}/runtime`, `${root}/foundation.json`);
    const restored = await fresh.readPersistedState();
    equal(restored?.desired, desiredNext);
    equal(restored?.checkpointIds, ['configure-checkpoint']);
    equal(restored?.lastAppliedCommandId, 'configure');
    const checkpoint = await fresh.readCheckpoint('configure-checkpoint');
    equal(checkpoint?.resources[0].previous.kind, 'desired-state');
    equal(checkpoint?.previousControllerState, persisted);
    const rollback = {
      kind: 'rollback',
      commandId: 'undo-configure',
      mode: 'apply',
      checkpointId: 'configure-checkpoint',
    } as const;
    const rollbackReads = {
      ...reads,
      persistedStateReader: fresh,
      checkpointReader: fresh,
      ownedResourceReader: fresh,
    };
    const rollbackWrites = { ...writes, desiredStateWriter: fresh, checkpointWriter: fresh };
    equal(
      (await applyRuntimeCommand(rollback, rollbackReads, rollbackWrites)).status,
      'rolled_back',
    );
    const afterRollback = new LocalRuntimeStateAdapter(
      `${root}/runtime`,
      `${root}/foundation.json`,
    );
    equal(await afterRollback.readPersistedState(), persisted);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('state write failure compensates; failed compensation is reported failed', async () => {
  const compensated = scenario({ failStateWrite: true });
  const result = await applyRuntimeCommand(
    bootstrap('state-fail'),
    compensated.reads,
    compensated.writes,
  );
  equal(result.status, 'failed');
  equal(result.actions.map((entry) => entry.status), ['compensated', 'compensated']);
  equal(compensated.checkpoints.get('state-fail-checkpoint')?.status, 'rolled_back');
  const partial = scenario({ failAction: 2, failCompensation: true });
  const incomplete = await applyRuntimeCommand(bootstrap('partial'), partial.reads, partial.writes);
  equal(incomplete.status, 'partially_rolled_back');
  equal(incomplete.actions.map((entry) => entry.status), ['failed', 'failed']);
  equal(incomplete.diagnostics.map((entry) => entry.code), [
    'provider_unavailable',
    'compensation_failed',
  ]);
  const explicit = scenario({ failCompensation: true });
  await applyRuntimeCommand(bootstrap('explicit'), explicit.reads, explicit.writes);
  const rollback = await applyRuntimeCommand(
    { kind: 'rollback', commandId: 'undo', mode: 'apply', checkpointId: 'explicit-checkpoint' },
    explicit.reads,
    explicit.writes,
  );
  equal(rollback.status, 'partially_rolled_back');
  equal(rollback.actions.map((entry) => entry.status), ['failed', 'failed']);
});

Deno.test('checkpoints retain typed inverse metadata and before/after fingerprints', async () => {
  const session = { agent: 'codex', sessionId: 'thread', worktree, boundary: 'idle' } as const;
  const target = { ...route, model: 'fallback' };
  for (
    const command of [
      {
        kind: 'fallback',
        commandId: 'fallback',
        mode: 'apply',
        session,
        currentRoute: route,
        targetRoute: target,
      },
      { kind: 'restore', commandId: 'restore', mode: 'apply', session, currentRoute: target },
    ] as const satisfies readonly RuntimeCommand[]
  ) {
    const s = scenario();
    s.fingerprints.set('session:codex:thread', 'sha256:before');
    const result = await applyRuntimeCommand(command, s.reads, s.writes);
    equal(result.status, 'succeeded');
    const resource = s.checkpoints.get(`${command.commandId}-checkpoint`)?.resources[0];
    equal(resource?.beforeFingerprint, 'sha256:before');
    equal(resource?.previous, { kind: 'route', route: command.currentRoute });
    assert(resource?.afterFingerprint.startsWith('sha256:'), 'missing target fingerprint');
    assert(
      resource?.action.kind === (command.kind === 'fallback' ? 'switch_route' : 'restore_route'),
      'wrong inverse action',
    );
    const rollback = await applyRuntimeCommand(
      {
        kind: 'rollback',
        commandId: `undo-${command.commandId}`,
        mode: 'apply',
        checkpointId: `${command.commandId}-checkpoint`,
      },
      s.reads,
      s.writes,
    );
    equal(rollback.status, 'rolled_back');
    equal(s.compensated[0]?.previous, { kind: 'route', route: command.currentRoute });
    equal(s.compensated[0]?.action.route, command.kind === 'fallback' ? target : route);
  }
});

Deno.test('explicit rollback rejects external drift without mutation and is idempotent', async () => {
  const s = scenario();
  await applyRuntimeCommand(bootstrap('owned'), s.reads, s.writes);
  const command = {
    kind: 'rollback',
    commandId: 'rollback',
    mode: 'apply',
    checkpointId: 'owned-checkpoint',
  } as const;
  const resource = s.checkpoints.get('owned-checkpoint')!.resources[0];
  s.fingerprints.set(resource.resourceId, 'sha256:external-change');
  s.events.length = 0;
  const refused = await applyRuntimeCommand(command, s.reads, s.writes);
  equal(refused.status, 'blocked');
  equal(refused.diagnostics[0]?.code, 'ownership_conflict');
  equal(s.events, []);
  for (const entry of s.checkpoints.get('owned-checkpoint')!.resources) {
    s.fingerprints.set(entry.resourceId, entry.afterFingerprint);
  }
  const rolled = await applyRuntimeCommand(command, s.reads, s.writes);
  equal(rolled.status, 'rolled_back');
  equal((await applyRuntimeCommand(command, s.reads, s.writes)).status, 'no_change');
});

Deno.test('blocked apply observes once and preserves the exact owner diagnostic', async () => {
  const s = scenario();
  const result = await applyRuntimeCommand(
    { kind: 'repair-codex-remote', commandId: 'repair', mode: 'apply', worktree },
    s.reads,
    s.writes,
  );
  equal(result.status, 'blocked');
  equal(result.diagnostics.map((entry) => [entry.code, entry.ownerIssue]), [[
    'capability_deferred',
    580,
  ]]);
  equal(s.observations(), 1);
  equal(s.events, []);
});

Deno.test('read stages classify probe, state, checkpoint, and desired failures', async () => {
  const cases: Array<[RuntimeCommand, keyof RuntimeReadPorts, string]> = [
    [{ kind: 'bootstrap', commandId: 'probe', mode: 'apply' }, 'inspector', 'probe_failed'],
    [
      { kind: 'bootstrap', commandId: 'state', mode: 'apply' },
      'persistedStateReader',
      'state_corrupt',
    ],
    [
      { kind: 'rollback', commandId: 'cp', mode: 'apply', checkpointId: 'bad' },
      'checkpointReader',
      'invalid_checkpoint',
    ],
    [
      { kind: 'configure', commandId: 'desired', mode: 'apply', desiredState: { path: '/bad' } },
      'desiredStateSource',
      'invalid_state_file',
    ],
  ];
  for (const [command, port, code] of cases) {
    const s = scenario();
    const broken = port === 'inspector'
      ? { observeRuntime: () => Promise.reject(new Error('synthetic')) }
      : port === 'persistedStateReader'
      ? { readPersistedState: () => Promise.reject(new Error('synthetic')) }
      : port === 'checkpointReader'
      ? { readCheckpoint: () => Promise.reject(new Error('synthetic')) }
      : { loadDesiredState: () => Promise.reject(new Error('synthetic')) };
    const reads = { ...s.reads, [port]: broken } as RuntimeReadPorts;
    const result = await applyRuntimeCommand(command, reads, s.writes);
    equal(result.diagnostics[0]?.code, code, `${port} classification differs`);
  }
});

Deno.test('planner-only calls remain mutation free and adapter diagnostics remain exact', async () => {
  const s = scenario({ failAction: 1 });
  const session = { agent: 'codex', sessionId: 'thread', worktree, boundary: 'idle' } as const;
  // deno-fmt-ignore
  const commands: RuntimeCommand[] = [
    { kind: 'bootstrap', commandId: 'bootstrap-plan', mode: 'plan' },
    { kind: 'configure', commandId: 'configure-plan', mode: 'plan', desiredState: { path: '/desired' } },
    { kind: 'launch', commandId: 'launch-plan', mode: 'plan', route, content: { path: '/prompt' } },
    { kind: 'resume', commandId: 'resume-plan', mode: 'plan', route: { ...route, sessionId: 'thread' }, session, content: { path: '/message' } },
    { kind: 'smoke', commandId: 'smoke-plan', mode: 'plan', route, level: 'static' },
    { kind: 'fallback', commandId: 'fallback-plan', mode: 'plan', session, currentRoute: route, targetRoute: route },
    { kind: 'restore', commandId: 'restore-plan', mode: 'plan', session, currentRoute: route },
    { kind: 'repair-codex-remote', commandId: 'repair-plan', mode: 'plan', worktree },
    { kind: 'rollback', commandId: 'rollback-plan', mode: 'plan', checkpointId: 'missing' },
  ];
  for (const command of commands) equal((await runRuntimeCommand(command, s.reads)).changed, false);
  equal(s.events, []);
  const failed = await applyRuntimeCommand(bootstrap('adapter'), s.reads, s.writes);
  equal(failed.diagnostics[0], failure('provider_unavailable'));
});
