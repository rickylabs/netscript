import { assertEquals, assertThrows } from '@std/assert';
import { MODEL_IDS, NATIVE_CANARY_MODEL_ARGS, ROUTING_MODEL_IDS } from '../config/models.ts';
import { DELEGATION_MATRIX } from '@harness/matrix';
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

Deno.test('active route and paid-launch policy read the pinned Harness matrix', async () => {
  for (
    const path of [
      '.llm/tools/agentic/runtime/routing-policy.ts',
      '.llm/tools/agentic/opencode/opencode-run.ts',
    ]
  ) {
    const source = await Deno.readTextFile(path);
    assertEquals(source.includes("from '@harness/matrix';"), true, path);
    assertEquals(source.includes('runtime/delegation-matrix.ts'), false, path);
    assertEquals(source.includes("from './delegation-matrix.ts';"), false, path);
  }
});

Deno.test('native routes and rollout canaries use the current harness model IDs', () => {
  assertEquals(MODEL_IDS.codexSol, 'gpt-6.1-sol');
  assertEquals(MODEL_IDS.codexLuna, 'gpt-6-luna');
  assertEquals(MODEL_IDS.fable, 'claude-fable-5-1');
  assertEquals(MODEL_IDS.opus, 'claude-opus-5-5');
  assertEquals(MODEL_IDS.sonnet, 'claude-sonnet-5-5');
  assertEquals(ROUTING_MODEL_IDS.solNative, MODEL_IDS.codexSol);
  assertEquals(ROUTING_MODEL_IDS.lunaNative, MODEL_IDS.codexLuna);
  assertEquals(ROUTING_MODEL_IDS.astraNative, 'gpt-6-astra');
  assertEquals(ROUTING_MODEL_IDS.fable51Native, MODEL_IDS.fable);
  assertEquals(ROUTING_MODEL_IDS.opus55Native, MODEL_IDS.opus);
  assertEquals(NATIVE_CANARY_MODEL_ARGS.codex, MODEL_IDS.codexSol);
  assertEquals(NATIVE_CANARY_MODEL_ARGS.claudeOpus, MODEL_IDS.opus);

  assertEquals(
    resolveWorkloadRoute({ tier: 'simple', role: 'implementation', worktree }).model,
    MODEL_IDS.codexSol,
  );
  assertEquals(
    resolveWorkloadRoute({ tier: 'feature', role: 'implementation', worktree }).model,
    MODEL_IDS.codexSol,
  );
});

Deno.test('Codex uses Sol 6.1 low for trivial work, xhigh otherwise, and unchanged Astra', () => {
  for (const tier of ['simple', 'straightforward', 'feature'] as const) {
    const route = resolveWorkloadRoute({ tier, role: 'implementation', worktree: '.' });
    assertEquals(
      [route.model, route.effort],
      ['gpt-6.1-sol', tier === 'simple' ? 'low' : 'xhigh'],
      tier,
    );
  }
  for (const [tier, effort] of [['complex', 'medium'], ['architecture', 'xhigh']] as const) {
    const route = resolveWorkloadRoute({
      tier,
      role: 'implementation',
      worktree: '.',
      privilegedTierAuthorization,
    });
    assertEquals([route.model, route.effort], ['gpt-6-astra', effort], tier);
  }
});

Deno.test('Copilot preserves native-family precedence and wins for attested non-native models', () => {
  const request = { tier: 'feature' as const, role: 'deep_research' as const, worktree };
  assertEquals(resolveWorkloadRoute(request).transport, 'agy');
  assertEquals(
    resolveWorkloadRoute({ ...request, unavailableTransports: ['agy'] }).model,
    ROUTING_MODEL_IDS.gemini38FlashCopilot,
  );
  assertEquals(
    resolveWorkloadRoute({ ...request, unavailableTransports: ['agy', 'github_copilot'] }).model,
    ROUTING_MODEL_IDS.solNative,
  );
  const plan = { tier: 'feature' as const, role: 'plan' as const, worktree };
  assertEquals(resolveWorkloadRoute(plan).transport, 'claude');
  assertEquals(
    resolveWorkloadRoute({ ...plan, unavailableTransports: ['claude'] }).model,
    ROUTING_MODEL_IDS.fable51Copilot,
  );
  const kimi = resolveWorkloadRoute({
    tier: 'complex',
    role: 'vision_evaluation',
    generatorModel: 'astra',
    worktree,
    privilegedTierAuthorization,
  });
  assertEquals([kimi.transport, kimi.provider, kimi.profileId, kimi.model], [
    'github_copilot',
    'github_copilot',
    'opencode-copilot',
    ROUTING_MODEL_IDS.kimiK3Copilot,
  ]);
  assertEquals(
    resolveWorkloadRoute({
      tier: 'architecture',
      role: 'implementation_evaluation',
      generatorModel: 'astra',
      worktree,
      privilegedTierAuthorization,
    }).model,
    ROUTING_MODEL_IDS.grok46Copilot,
  );
});

Deno.test('canonical inspection policy is derived from all matrix cells', () => {
  assertEquals(CANONICAL_ROUTE_POLICY.length, 76);
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

Deno.test('SOL handles feature implementation while Astra stays on privileged tiers', () => {
  assertEquals(
    resolveWorkloadRoute({
      tier: 'feature',
      role: 'implementation',
      worktree,
    }),
    {
      agent: 'codex',
      provider: 'openai',
      model: ROUTING_MODEL_IDS.solNative,
      effort: 'xhigh',
      worktree,
      mobileRequired: false,
      logicalModel: 'sol',
      family: 'openai',
      transport: 'codex',
      requestedEffort: 'xhigh',
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

Deno.test('deep research uses Gemini by coverage and only native Sol 6.1 low as fallback', () => {
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
    ['sol', 'codex', ROUTING_MODEL_IDS.solNative, 'low'],
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

Deno.test('UI/UX routes use Kimi while vision evaluation skips the Kimi family', () => {
  const implementation = resolveWorkloadRoute({
    tier: 'complex',
    role: 'ui_ux',
    worktree,
    privilegedTierAuthorization,
  });
  assertEquals(
    [implementation.logicalModel, implementation.requestedEffort, implementation.transport],
    ['kimi_k3', 'max', 'github_copilot'],
  );

  const evaluation = resolveWorkloadRoute({
    tier: 'complex',
    role: 'vision_evaluation',
    generatorModel: implementation.logicalModel,
    worktree,
    privilegedTierAuthorization,
  });
  assertEquals(
    [evaluation.logicalModel, evaluation.requestedEffort, evaluation.transport],
    ['gemini_3_8_flash', 'high', 'agy'],
  );
});

Deno.test('owner override bypasses a matrix cell but not evaluator-family independence', () => {
  const ownerMatrixOverride = {
    authorizer: 'owner' as const,
    rationale: 'Owner selected Kimi for this bounded implementation.',
    worklogPath: '.llm/runs/routing-test/worklog.md',
    route: { model: 'kimi_k3' as const, effort: 'high' as const },
  };
  const route = resolveWorkloadRoute({
    tier: 'straightforward',
    role: 'implementation',
    worktree,
    ownerMatrixOverride,
  });
  assertEquals(route.logicalModel, 'kimi_k3');
  assertEquals(route.ownerMatrixOverride, ownerMatrixOverride);

  assertThrows(
    () =>
      resolveWorkloadRoute({
        tier: 'feature',
        role: 'implementation_evaluation',
        generatorModel: 'astra',
        worktree,
        ownerMatrixOverride: {
          ...ownerMatrixOverride,
          route: { model: 'luna', effort: 'max' },
        },
      }),
    Error,
    'no available opposite openai route',
  );
});

Deno.test('owner override resolves Claude Opus 5.5 high without changing a matrix cell', () => {
  const selected = resolveWorkloadRoute({
    tier: 'straightforward',
    role: 'implementation',
    worktree,
    ownerMatrixOverride: {
      authorizer: 'owner',
      rationale: 'A bounded Claude proof.',
      worklogPath: '.llm/runs/claude-proof/worklog.md',
      route: { model: 'opus_5_5', effort: 'high' },
    },
  });
  assertEquals([selected.logicalModel, selected.model, selected.transport, selected.effort], [
    'opus_5_5',
    ROUTING_MODEL_IDS.opus55Native,
    'claude',
    'high',
  ]);
  assertEquals(DELEGATION_MATRIX.straightforward.implementation[0], {
    model: 'sol',
    effort: 'xhigh',
  });
});

Deno.test('owner override requires a durable harness worklog path', () => {
  assertThrows(
    () =>
      resolveWorkloadRoute({
        tier: 'straightforward',
        role: 'implementation',
        worktree,
        ownerMatrixOverride: {
          authorizer: 'owner',
          rationale: 'Unrecorded shortcut.',
          worklogPath: '.llm/tmp/override.md',
          route: { model: 'kimi_k3', effort: 'high' },
        },
      }),
    Error,
    'must cite a repo-relative .llm/runs/**/worklog.md',
  );
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
  for (const tier of ['small_project', 'project', 'milestone'] as const) {
    const route = resolveCoordinatorRoute({ tier, worktree });
    assertEquals([route.logicalModel, route.effort], ['sol', 'xhigh']);
  }
  const framework = resolveCoordinatorRoute({ tier: 'framework', worktree });
  assertEquals([framework.logicalModel, framework.effort], ['sol', 'xhigh']);
  assertEquals(
    resolveCoordinatorRoute({
      tier: 'framework',
      unavailableModels: ['sol'],
      worktree,
    }).logicalModel,
    'opus_5',
  );
  assertEquals(
    resolveCoordinatorRoute({
      tier: 'milestone',
      unavailableModels: ['sol', 'fable_5_1'],
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
        unavailableModels: ['sol', 'muse_spark_1_3'],
        worktree,
      }),
    Error,
    'no available route',
  );
});
