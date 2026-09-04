import { assertEquals, assertThrows } from '@std/assert';
import { ROUTING_MODEL_IDS } from '../config/models.ts';
import {
  assertEvaluatorIndependence,
  CANONICAL_COORDINATOR_POLICY,
  CANONICAL_ROUTE_POLICY,
  resolveCoordinatorRoute,
  resolveLegacyRouteForNewSelection,
  resolveWorkloadRoute,
} from './routing-policy.ts';

const worktree = '/home/agent/projects/netscript/worktrees/routing-test';
const privilegedTierAuthorization = {
  authorizer: 'milestone_coordinator' as const,
  rationale: 'Recorded cross-package milestone escalation.',
};

Deno.test('canonical inspection policy is derived from all matrix cells', () => {
  assertEquals(CANONICAL_ROUTE_POLICY.length, 66);
  assertEquals(
    CANONICAL_ROUTE_POLICY.filter((entry) =>
      entry.tier === 'architecture' && entry.role === 'implementation'
    ),
    [
      {
        tier: 'architecture',
        role: 'implementation',
        priority: 0,
        model: 'astra',
        family: 'openai',
        effort: 'xhigh',
      },
      {
        tier: 'architecture',
        role: 'implementation',
        priority: 1,
        model: 'fable_5_1',
        family: 'anthropic',
        effort: 'xhigh',
      },
    ],
  );
  assertEquals(CANONICAL_COORDINATOR_POLICY.length, 9);
});

Deno.test('Astra replaces SOL for feature and higher implementation tiers', () => {
  assertEquals(
    resolveWorkloadRoute({
      tier: 'feature',
      role: 'implementation',
      worktree,
    }),
    {
      agent: 'codex',
      provider: 'openai',
      model: ROUTING_MODEL_IDS.astraNative,
      effort: 'low',
      worktree,
      mobileRequired: false,
      logicalModel: 'astra',
      family: 'openai',
      transport: 'codex',
      requestedEffort: 'low',
    },
  );
  assertEquals(
    resolveWorkloadRoute({
      tier: 'complex',
      role: 'implementation',
      worktree,
      privilegedTierAuthorization,
    }).effort,
    'medium',
  );
  assertEquals(
    resolveWorkloadRoute({
      tier: 'complex',
      role: 'implementation',
      worktree,
      privilegedTierAuthorization,
    }).privilegedTierAuthorization,
    privilegedTierAuthorization,
  );
  assertEquals(
    resolveWorkloadRoute({
      tier: 'architecture',
      role: 'implementation',
      worktree,
      privilegedTierAuthorization,
    }).effort,
    'xhigh',
  );
});

Deno.test('provider capability resolution honors subscription-first order', () => {
  const go = resolveWorkloadRoute({
    tier: 'feature',
    role: 'implementation_evaluation',
    generatorModel: 'astra',
    worktree,
  });
  assertEquals([go.transport, go.provider, go.model], [
    'opencode_go',
    'opencode_go',
    ROUTING_MODEL_IDS.museSpark13Go,
  ]);
  const ollama = resolveWorkloadRoute({
    tier: 'feature',
    role: 'implementation_evaluation',
    generatorModel: 'astra',
    unavailableTransports: ['opencode_go'],
    unavailableModels: ['muse_spark_1_3'],
    worktree,
  });
  assertEquals(ollama.logicalModel, 'opus_5');
  assertEquals(ollama.transport, 'claude');
});

Deno.test('deep research uses Gemini by coverage and only native Luna as fallback', () => {
  const primary = resolveWorkloadRoute({
    tier: 'straightforward',
    role: 'deep_research',
    worktree,
  });
  assertEquals(
    [primary.logicalModel, primary.transport, primary.model, primary.requestedEffort],
    ['gemini_3_8_flash', 'agy', ROUTING_MODEL_IDS.gemini38FlashNative, 'medium'],
  );

  const fallback = resolveWorkloadRoute({
    tier: 'feature',
    role: 'deep_research',
    unavailableModels: ['gemini_3_8_flash'],
    worktree,
  });
  assertEquals(
    [fallback.logicalModel, fallback.transport, fallback.model, fallback.requestedEffort],
    ['luna', 'codex', ROUTING_MODEL_IDS.lunaNative, 'max'],
  );

  assertThrows(
    () =>
      resolveWorkloadRoute({
        tier: 'feature',
        role: 'deep_research',
        unavailableModels: ['gemini_3_8_flash'],
        unavailableTransports: ['codex'],
        worktree,
      }),
    Error,
    'no available route in the declared fallback chain',
  );
});

Deno.test('same-family evaluator candidates are skipped before provider selection', () => {
  const route = resolveWorkloadRoute({
    tier: 'straightforward',
    role: 'implementation_evaluation',
    generatorModel: 'glm_5_3_flash',
    worktree,
  });
  assertEquals(route.logicalModel, 'deepseek_v4_pro');
  assertEquals(route.model, ROUTING_MODEL_IDS.deepseekV4ProGo);

  const plan = resolveWorkloadRoute({
    tier: 'complex',
    role: 'plan_evaluation',
    generatorModel: 'muse_spark_1_3',
    worktree,
    privilegedTierAuthorization,
  });
  assertEquals(plan.logicalModel, 'grok_4_6');
  assertEquals(plan.effort, 'high');
});

Deno.test('complex rows fail closed without recorded privileged-tier authority', () => {
  assertThrows(
    () => resolveWorkloadRoute({ tier: 'complex', role: 'implementation', worktree }),
    Error,
    'requires explicit owner or milestone-coordinator authorization',
  );
  assertThrows(
    () => resolveWorkloadRoute({ tier: 'architecture', role: 'implementation', worktree }),
    Error,
    'requires explicit owner or milestone-coordinator authorization',
  );
});

Deno.test('provider-default effort resolves through the pinned OpenCode default', () => {
  const route = resolveWorkloadRoute({
    tier: 'feature',
    role: 'plan_evaluation',
    generatorModel: 'fable_5_1',
    worktree,
  });
  assertEquals(route.requestedEffort, 'provider_default');
  assertEquals(route.effort, 'high');
});

Deno.test('unavailable providers advance inside the model capability chain', () => {
  const route = resolveWorkloadRoute({
    tier: 'feature',
    role: 'plan_evaluation',
    generatorModel: 'astra',
    unavailableTransports: ['opencode_go', 'ollama'],
    worktree,
  });
  assertEquals(route.transport, 'openrouter');
  assertEquals(route.model, ROUTING_MODEL_IDS.glm53OpenRouter);
});

Deno.test('coordinator routes follow the dedicated matrix', () => {
  assertEquals(resolveCoordinatorRoute({ tier: 'framework', worktree }).logicalModel, 'astra');
  assertEquals(
    resolveCoordinatorRoute({
      tier: 'framework',
      unavailableModels: ['astra'],
      worktree,
    }).logicalModel,
    'opus_5',
  );
  assertEquals(
    resolveCoordinatorRoute({
      tier: 'milestone',
      unavailableModels: ['astra', 'fable_5_1'],
      worktree,
    }).logicalModel,
    'opus_5',
  );
});

Deno.test('evaluation requires a selected generator and a separate vendor/session', () => {
  assertThrows(
    () => resolveWorkloadRoute({ tier: 'feature', role: 'plan_evaluation', worktree }),
    Error,
    'requires the selected generator model',
  );
  assertThrows(
    () =>
      assertEvaluatorIndependence(
        {
          agent: 'codex',
          sessionId: 'same',
          worktree,
          boundary: 'idle',
          model: 'astra',
        },
        {
          agent: 'opencode',
          sessionId: 'same',
          worktree,
          boundary: 'new',
          model: 'glm_5_3',
        },
      ),
    Error,
    'sessions must differ',
  );
  assertThrows(
    () =>
      assertEvaluatorIndependence(
        {
          agent: 'codex',
          sessionId: 'generator',
          worktree,
          boundary: 'idle',
          model: 'astra',
        },
        {
          agent: 'codex',
          sessionId: 'evaluator',
          worktree,
          boundary: 'new',
          model: 'sol',
        },
      ),
    Error,
    'families must differ',
  );
});

Deno.test('N/A roles and legacy active selection fail closed', () => {
  assertThrows(
    () => resolveWorkloadRoute({ tier: 'simple', role: 'plan', worktree }),
    Error,
    'not applicable',
  );
  assertThrows(
    () => resolveLegacyRouteForNewSelection('normal_implementation'),
    Error,
    'deserialize-only',
  );
});

Deno.test('empty capability chain reports a deterministic unavailable error', () => {
  assertThrows(
    () =>
      resolveWorkloadRoute({
        tier: 'feature',
        role: 'implementation',
        unavailableModels: ['astra', 'muse_spark_1_3'],
        worktree,
      }),
    Error,
    'no available route',
  );
});
