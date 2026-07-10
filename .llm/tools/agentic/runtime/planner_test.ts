import {
  OBSERVED_FOUNDATION_COMPONENTS,
  type RouteIdentity,
  RUNTIME_SCHEMA_VERSION,
  type RuntimeCommand,
  type RuntimeResult,
} from './contract.ts';
import { planReconciliation } from './planner.ts';
import { runtimeExitCode } from './output.ts';
import type { DesiredRuntimeState, ObservedRuntimeState } from './state.ts';
import { RUNTIME_TEST_COMPONENT_VERSIONS } from './test-fixtures.ts';
import { assert, assertEquals } from '@std/assert';

const worktree = '/home/codex/repos/worktree';
const route: RouteIdentity = {
  agent: 'codex',
  provider: 'openai',
  model: 'model-id',
  effort: 'medium',
  worktree,
  mobileRequired: true,
};

const desired: DesiredRuntimeState = {
  schemaVersion: RUNTIME_SCHEMA_VERSION,
  stateId: 'desired-1',
  foundation: {
    nativeExt4: true,
    versions: RUNTIME_TEST_COMPONENT_VERSIONS,
    stateDirectories: ['claude', 'codex', 'antigravity', 'netscript-agentic'],
  },
  agents: {
    codex: { required: true, authRoute: 'provider-native', route },
  },
  worktrees: [{ path: worktree, branch: 'feature', upstream: 'none', clean: true }],
  sessions: [],
};

function observed(overrides: Partial<ObservedRuntimeState> = {}): ObservedRuntimeState {
  return {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    stateId: 'observed-1',
    nativeExt4: true,
    components: [
      { component: 'node', version: RUNTIME_TEST_COMPONENT_VERSIONS.node, status: 'ready' },
      { component: 'claude', version: RUNTIME_TEST_COMPONENT_VERSIONS.claude, status: 'ready' },
      {
        component: 'antigravity',
        version: RUNTIME_TEST_COMPONENT_VERSIONS.antigravity,
        status: 'ready',
      },
    ],
    auth: [],
    stateDirectories: ['claude', 'codex', 'antigravity', 'netscript-agentic'],
    capabilities: { claude: 'available', codex: 'available', antigravity: 'deferred' },
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
    ...overrides,
  };
}

function plan(command: RuntimeCommand, state = observed(), wanted = desired) {
  return planReconciliation({ command, desired: wanted, observed: state });
}

Deno.test('runtime component version fixture is immutable and explicitly ordered', () => {
  assertEquals(Object.keys(RUNTIME_TEST_COMPONENT_VERSIONS), ['node', 'claude', 'antigravity']);
  assert(
    Object.isFrozen(RUNTIME_TEST_COMPONENT_VERSIONS),
    'component version fixture must be frozen',
  );
});

Deno.test('equal configured state plans no actions', () => {
  const result = plan({
    kind: 'configure',
    commandId: 'configure-1',
    mode: 'plan',
    desiredState: { path: '/desired.json' },
  });
  assertEquals(result.status, 'no_change');
  assertEquals(result.actions, []);
  assertEquals(result.changed, false);
});

Deno.test('equal bootstrap state plans no actions', () => {
  const result = plan({ kind: 'bootstrap', commandId: 'bootstrap-1', mode: 'plan' });
  assertEquals(result.status, 'no_change');
  assertEquals(result.actions, []);
});

Deno.test('doctor accepts the complete PR 0A observed component vocabulary', () => {
  const components = OBSERVED_FOUNDATION_COMPONENTS.map((component) => ({
    component,
    version: null,
    status: 'ready' as const,
  }));
  const result = plan(
    { kind: 'doctor', commandId: 'doctor-full-surface', mode: 'inspect' },
    observed({ components }),
  );
  assertEquals(result.status, 'no_change');
  assertEquals(result.actions, []);
  assertEquals(components.map((entry) => entry.component), [...OBSERVED_FOUNDATION_COMPONENTS]);
});

Deno.test('planner blocks a runtime-forced illegal command mode', () => {
  const command = {
    kind: 'doctor',
    commandId: 'doctor-illegal',
    mode: 'apply',
  } as unknown as RuntimeCommand;
  const result = plan(command);
  assertEquals(result.status, 'blocked');
  assertEquals(result.diagnostics[0]?.code, 'invalid_command');
  assertEquals(result.actions.map((action) => action.kind), ['blocked_intent']);
});

Deno.test('bootstrap drift yields deterministic data-only actions in finite order', () => {
  const drifted = observed({
    components: [
      { component: 'node', version: '18.19.1', status: 'outdated' },
      { component: 'claude', version: null, status: 'missing' },
      { component: 'antigravity', version: null, status: 'outdated' },
      { component: 'deno', version: null, status: 'missing' },
      { component: 'docker', version: null, status: 'missing' },
      { component: 'antigravity-auth', version: null, status: 'auth_required' },
    ],
    stateDirectories: [],
  });
  const command = { kind: 'bootstrap', commandId: 'bootstrap-2', mode: 'plan' } as const;
  const first = plan(command, drifted);
  const second = plan(command, drifted);

  assertEquals(
    JSON.stringify(first),
    JSON.stringify(second),
    'planner output is not deterministic',
  );
  assertEquals(first.status, 'planned');
  assertEquals(first.actions.map((action) => action.kind), [
    'install_component',
    'install_component',
    'install_component',
    'create_state_directory',
    'create_state_directory',
    'create_state_directory',
    'create_state_directory',
  ]);
  assertEquals(first.actions.map((action) => action.id), [
    'bootstrap-2:01:install_component',
    'bootstrap-2:02:install_component',
    'bootstrap-2:03:install_component',
    'bootstrap-2:04:create_state_directory',
    'bootstrap-2:05:create_state_directory',
    'bootstrap-2:06:create_state_directory',
    'bootstrap-2:07:create_state_directory',
  ]);
  assertEquals(
    first.actions.filter((action) => action.kind === 'install_component').map((action) =>
      action.component
    ),
    ['node', 'claude', 'antigravity'],
    'bootstrap planned an unsupported foundation install',
  );
  assert(first.actions.every((action) => action.reversible), 'bootstrap action is not reversible');
  assert(!JSON.stringify(first).includes('function'), 'plan contains executable data');
});

Deno.test('Codex repair plans one explicit mobile-control action', () => {
  const result = plan({
    kind: 'repair-codex-remote',
    commandId: 'repair-1',
    mode: 'plan',
    worktree,
  });
  assertEquals(result.status, 'planned');
  assertEquals(result.actions.map((action) => action.kind), ['repair_codex_remote']);
  assertEquals(result.diagnostics, []);
  assertEquals(result.changed, false);
});

Deno.test('OpenRouter route planning is available after issue 577 profile selection', () => {
  const result = plan({
    kind: 'launch',
    commandId: 'launch-openrouter',
    mode: 'plan',
    route: { ...route, provider: 'openrouter', profileId: 'codex-openrouter' },
    content: { path: '/brief.md' },
  });
  assertEquals(result.status, 'planned');
  assertEquals(result.actions[0]?.kind, 'launch_session');
});

Deno.test('Antigravity live smoke planning is enabled after owner acceptance', () => {
  const result = plan({
    kind: 'smoke',
    commandId: 'smoke-antigravity',
    mode: 'plan',
    route: { ...route, agent: 'antigravity', provider: 'google' },
    level: 'live',
  });
  assertEquals(result.status, 'planned');
  assertEquals(result.actions[0]?.kind, 'smoke_session');
});

Deno.test('fallback never changes route inside an active turn', () => {
  const result = plan({
    kind: 'fallback',
    commandId: 'fallback-1',
    mode: 'plan',
    session: { agent: 'codex', sessionId: 'session-1', worktree, boundary: 'active' },
    currentRoute: { ...route, sessionId: 'session-1' },
    targetRoute: route,
  });
  assertEquals(result.status, 'blocked');
  assertEquals(result.diagnostics[0]?.code, 'turn_boundary_required');
  assertEquals(result.actions[0]?.effect, 'none');
});

Deno.test('unsafe worktree blocks launch before any session action', () => {
  const result = plan(
    {
      kind: 'launch',
      commandId: 'launch-unsafe',
      mode: 'plan',
      route,
      content: { path: '/brief.md' },
    },
    observed({
      worktrees: [{
        path: worktree,
        branch: 'feature',
        upstream: 'origin/feature',
        dirty: false,
        nativeExt4: true,
        found: true,
      }],
    }),
  );
  assertEquals(result.status, 'blocked');
  assertEquals(result.diagnostics[0]?.code, 'unsafe_worktree');
  assertEquals(result.actions.map((action) => action.kind), ['blocked_intent']);
});

Deno.test('controller lifecycle apply is a permanent plan-only boundary', () => {
  const session = { agent: 'codex', sessionId: 'session-1', worktree, boundary: 'idle' } as const;
  const liveRoute = { ...route, sessionId: session.sessionId };
  const openrouter = { ...liveRoute, provider: 'openrouter' } as const;
  const antigravitySession = { ...session, agent: 'antigravity' } as const;
  const antigravity = { ...liveRoute, agent: 'antigravity', provider: 'google' } as const;
  const commands: RuntimeCommand[] = [
    {
      kind: 'launch',
      commandId: 'apply-launch',
      mode: 'apply',
      route,
      content: { path: '/brief' },
    },
    {
      kind: 'resume',
      commandId: 'apply-resume',
      mode: 'apply',
      route: liveRoute,
      session,
      content: { path: '/turn' },
    },
    { kind: 'smoke', commandId: 'apply-smoke', mode: 'apply', route, level: 'static' },
    {
      kind: 'launch',
      commandId: 'apply-openrouter-launch',
      mode: 'apply',
      route: openrouter,
      content: { path: '/brief' },
    },
    {
      kind: 'resume',
      commandId: 'apply-openrouter-resume',
      mode: 'apply',
      route: openrouter,
      session,
      content: { path: '/turn' },
    },
    {
      kind: 'smoke',
      commandId: 'apply-openrouter-smoke',
      mode: 'apply',
      route: openrouter,
      level: 'static',
    },
    {
      kind: 'launch',
      commandId: 'apply-antigravity-launch',
      mode: 'apply',
      route: antigravity,
      content: { path: '/brief' },
    },
    {
      kind: 'resume',
      commandId: 'apply-antigravity-resume',
      mode: 'apply',
      route: antigravity,
      session: antigravitySession,
      content: { path: '/turn' },
    },
    {
      kind: 'smoke',
      commandId: 'apply-antigravity-smoke',
      mode: 'apply',
      route: antigravity,
      level: 'static',
    },
  ];
  for (const command of commands) {
    const result = plan(command);
    assertEquals([
      result.status,
      result.actions[0]?.kind,
      result.diagnostics[0]?.code,
      result.diagnostics[0]?.ownerIssue,
      runtimeExitCode({ status: result.status, diagnostics: result.diagnostics } as RuntimeResult),
    ], [
      'blocked',
      'blocked_intent',
      'capability_unsupported',
      undefined,
      4,
    ]);
    assert(
      result.diagnostics[0]?.message.includes('ownership-enforced agent launcher'),
      'unsupported apply did not direct the caller to the launcher',
    );
  }
  assertEquals(
    plan({
      kind: 'launch',
      commandId: 'plan-launch',
      mode: 'plan',
      route,
      content: { path: '/brief' },
    }).actions[0]?.kind,
    'launch_session',
  );
});

Deno.test('false current-route metadata is rejected before route mutation planning', () => {
  const session = { agent: 'codex', sessionId: 'session-1', worktree, boundary: 'idle' } as const;
  const result = plan({
    kind: 'fallback',
    commandId: 'false-route',
    mode: 'apply',
    session,
    currentRoute: route,
    targetRoute: route,
  });
  assertEquals([result.status, result.diagnostics[0]?.code], ['blocked', 'route_conflict']);
});

Deno.test('rollback is idempotent and plans only an observed prepared checkpoint', () => {
  const command = {
    kind: 'rollback',
    commandId: 'rollback-1',
    mode: 'plan',
    checkpointId: 'checkpoint-1',
  } as const;
  const prepared = plan(
    command,
    observed({
      checkpoints: [{ checkpointId: 'checkpoint-1', commandId: 'apply-1', status: 'prepared' }],
    }),
  );
  assertEquals(prepared.status, 'planned');
  assertEquals(prepared.actions.map((action) => action.kind), ['rollback_checkpoint']);

  const completed = plan(
    command,
    observed({
      checkpoints: [{ checkpointId: 'checkpoint-1', commandId: 'apply-1', status: 'rolled_back' }],
    }),
  );
  assertEquals(completed.status, 'no_change');
  assertEquals(completed.actions, []);
});
