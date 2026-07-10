import { DEFERRED_ISSUES, RUNTIME_SCHEMA_VERSION, type RuntimeCommand } from './contract.ts';
import { planReconciliation } from './planner.ts';
import type { ObservedRuntimeState } from './state.ts';

function assert(condition: unknown, message = 'assertion failed'): asserts condition {
  if (!condition) throw new Error(message);
}
function assertEquals(actual: unknown, expected: unknown, message = 'values differ'): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) throw new Error(`${message}\nactual: ${left}\nexpected: ${right}`);
}
const worktree = '/home/codex/repos/provider-profile-test';
const observed: ObservedRuntimeState = {
  schemaVersion: RUNTIME_SCHEMA_VERSION,
  stateId: 'deferred-boundaries',
  nativeExt4: true,
  components: [],
  auth: [],
  stateDirectories: [],
  capabilities: {},
  worktrees: [{
    path: worktree,
    branch: 'feature',
    upstream: null,
    dirty: false,
    nativeExt4: true,
    found: true,
  }],
  sessions: [],
  configuredDesiredState: null,
  checkpoints: [],
};

function plan(command: RuntimeCommand) {
  return planReconciliation({ command, desired: null, observed });
}

Deno.test('deferred child-issue registry removes only landed 579 and retains 580 through 582', () => {
  assertEquals(DEFERRED_ISSUES.filter((issue) => issue >= 579), [580, 581, 582]);
});

Deno.test('Antigravity live evidence plans while apply remains issue 580 blocked', () => {
  const result = plan({
    kind: 'smoke',
    commandId: 'deferred-578',
    mode: 'plan',
    route: {
      agent: 'antigravity',
      provider: 'google',
      model: 'caller-model',
      effort: 'low',
      worktree,
      mobileRequired: false,
    },
    level: 'live',
  });
  assertEquals(result.status, 'planned');
  assertEquals(result.actions.map((entry) => entry.kind), ['smoke_session']);
  const apply = plan({
    kind: 'smoke',
    commandId: 'apply-580',
    mode: 'apply',
    route: {
      agent: 'antigravity',
      provider: 'google',
      model: 'caller-model',
      effort: 'low',
      worktree,
      mobileRequired: false,
    },
    level: 'live',
  });
  assertEquals(apply.diagnostics.map((entry) => [entry.code, entry.ownerIssue]), [
    ['capability_deferred', 580],
  ]);
});

Deno.test('all provider lifecycle apply paths remain issue 580 blocked', () => {
  const routes = [
    {
      agent: 'claude',
      provider: 'anthropic',
      profileId: 'claude-anthropic-native',
      model: 'caller-model',
      effort: 'high',
    },
    {
      agent: 'codex',
      provider: 'openai',
      profileId: 'codex-openai-native',
      model: 'caller-model',
      effort: 'high',
    },
    {
      agent: 'codex',
      provider: 'openrouter',
      profileId: 'codex-openrouter',
      model: 'z-ai/glm-5.2',
      effort: 'xhigh',
    },
  ] as const;
  for (const [index, route] of routes.entries()) {
    const result = plan({
      kind: 'smoke',
      commandId: `deferred-580-${index}`,
      mode: 'apply',
      route: { ...route, worktree, mobileRequired: false },
      level: 'static',
    });
    assertEquals(result.diagnostics.map((entry) => [entry.code, entry.ownerIssue]), [
      ['capability_deferred', 580],
    ]);
  }
  const repair = plan({
    kind: 'repair-codex-remote',
    commandId: 'deferred-repair-580',
    mode: 'apply',
    worktree,
  });
  assertEquals(repair.diagnostics.map((entry) => [entry.code, entry.ownerIssue]), [
    ['capability_deferred', 580],
  ]);
});

Deno.test('issues 581 and 582 remain absent capabilities rather than hidden implementations', () => {
  const serialized = JSON.stringify(plan({
    kind: 'doctor',
    commandId: 'deferred-no-hidden-policy',
    mode: 'inspect',
  }));
  for (const forbidden of ['routing_policy_migration', 'rollout_promotion']) {
    assert(!serialized.includes(forbidden), `hidden deferred capability appeared: ${forbidden}`);
  }
});
