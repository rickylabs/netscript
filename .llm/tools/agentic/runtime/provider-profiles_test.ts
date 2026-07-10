import { type RouteIdentity, RUNTIME_SCHEMA_VERSION } from './contract.ts';
import { planReconciliation } from './planner.ts';
import {
  matchOpenRouterPreset,
  OPENROUTER_PRESET_MODELS,
  OPENROUTER_PRESETS,
  PROVIDER_CREDENTIAL_KEYS,
  PROVIDER_PROFILES,
  resolveProviderProfile,
} from './provider-profiles.ts';
import { validateProviderRoute } from './adapters/provider-adapter.ts';
import type { ObservedRuntimeState } from './state.ts';

const worktree = '/home/codex/repos/provider-profile-test';
function assert(condition: unknown, message = 'assertion failed'): asserts condition {
  if (!condition) throw new Error(message);
}
function assertEquals(actual: unknown, expected: unknown, message = 'values differ'): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) throw new Error(`${message}\nactual: ${left}\nexpected: ${right}`);
}
function route(values: Partial<RouteIdentity> = {}): RouteIdentity {
  return {
    agent: 'codex',
    provider: 'openrouter',
    profileId: 'codex-openrouter',
    model: 'z-ai/glm-5.2',
    effort: 'xhigh',
    worktree,
    mobileRequired: false,
    ...values,
  };
}

function observedState(overrides: Partial<ObservedRuntimeState> = {}): ObservedRuntimeState {
  return {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    stateId: 'provider-profile-test',
    nativeExt4: true,
    components: [],
    auth: [],
    stateDirectories: [],
    capabilities: {},
    worktrees: [],
    sessions: [],
    configuredDesiredState: null,
    checkpoints: [],
    ...overrides,
  };
}

Deno.test('provider profiles are finite, frozen, and clear every rival credential key', () => {
  assert(Object.isFrozen(PROVIDER_PROFILES));
  for (const profile of Object.values(PROVIDER_PROFILES)) {
    assert(Object.isFrozen(profile));
    for (const key of PROVIDER_CREDENTIAL_KEYS) {
      if (key === profile.credentialTargetKey) continue;
      assert(profile.clearKeys.includes(key), `${profile.id} retained rival ${key}`);
    }
  }
});

Deno.test('OpenRouter preset slugs and route purposes are locked', () => {
  assertEquals(OPENROUTER_PRESET_MODELS, [
    'minimax/minimax-m3',
    'z-ai/glm-5.2',
    'x-ai/grok-4.5',
  ]);
  assertEquals(matchOpenRouterPreset(route()), OPENROUTER_PRESETS['codex-design-glm-5-2']);
  assertEquals(matchOpenRouterPreset(route({ effort: 'medium' })), null);
  assertEquals(
    matchOpenRouterPreset(route({
      agent: 'claude',
      profileId: 'claude-openrouter',
      model: 'minimax/minimax-m3',
      effort: 'high',
    })),
    OPENROUTER_PRESETS['claude-fanout-minimax-m3'],
  );
});

Deno.test('native profiles resolve compatibly while non-native routes require explicit profiles', () => {
  assertEquals(
    resolveProviderProfile(route({ agent: 'claude', provider: 'anthropic', profileId: undefined })),
    PROVIDER_PROFILES['claude-anthropic-native'],
  );
  const missing = validateProviderRoute({
    route: route({ profileId: undefined }),
    nativeExt4: true,
    requireSession: false,
  });
  assertEquals(missing.ok, false);
  assertEquals(missing.diagnostics.map((entry) => entry.code), ['unsupported_route']);
  const valid = validateProviderRoute({ route: route(), nativeExt4: true, requireSession: false });
  assertEquals(valid, { ok: true, diagnostics: [], conflictingKeyNames: [] });
});

Deno.test('profile mismatch and rival credential presence fail explicitly by key name only', () => {
  const mismatch = validateProviderRoute({
    route: route({ profileId: 'claude-openrouter' }),
    nativeExt4: true,
    requireSession: false,
  });
  assertEquals(mismatch.diagnostics.map((entry) => entry.code), ['route_conflict']);
  const conflict = validateProviderRoute({
    route: route(),
    nativeExt4: true,
    requireSession: false,
    credentialKeyNames: ['ANTHROPIC_API_KEY', 'OPENROUTER_API_KEY'],
  });
  assertEquals(conflict.conflictingKeyNames, ['ANTHROPIC_API_KEY']);
  assertEquals(conflict.diagnostics.map((entry) => entry.code), ['auth_conflict']);
});

Deno.test('OpenRouter plan mode is enabled while controller apply remains unsupported', () => {
  const observed = observedState({
    worktrees: [{
      path: worktree,
      branch: 'feature',
      upstream: null,
      dirty: false,
      nativeExt4: true,
      found: true,
    }],
  });
  const command = {
    kind: 'smoke',
    commandId: 'openrouter-plan',
    mode: 'plan',
    route: route(),
    level: 'static',
  } as const;
  const planned = planReconciliation({ command, desired: null, observed });
  assertEquals(planned.status, 'planned');
  assertEquals(planned.actions[0]?.kind, 'smoke_session');
  const apply = planReconciliation({
    command: { ...command, commandId: 'openrouter-apply', mode: 'apply' },
    desired: null,
    observed,
  });
  assertEquals(apply.status, 'blocked');
  assertEquals(apply.diagnostics[0]?.ownerIssue, undefined);
  assertEquals(apply.diagnostics[0]?.code, 'capability_unsupported');
});

Deno.test('Antigravity live evidence plans without changing provider profiles', () => {
  const observed = observedState({
    worktrees: [{
      path: worktree,
      branch: 'feature',
      upstream: null,
      dirty: false,
      nativeExt4: true,
      found: true,
    }],
  });
  const result = planReconciliation({
    command: {
      kind: 'smoke',
      commandId: 'antigravity-live',
      mode: 'plan',
      route: route({
        agent: 'antigravity',
        provider: 'google',
        profileId: undefined,
      }),
      level: 'live',
    },
    desired: null,
    observed,
  });
  assertEquals(result.status, 'planned');
  assertEquals(result.actions[0]?.kind, 'smoke_session');
});
