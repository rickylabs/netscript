import { assertEquals, assertThrows } from '@std/assert';
import { ROUTING_MODEL_IDS } from '../config/models.ts';
import {
  assertWorkloadModelAllowed,
  COORDINATOR_MATRIX,
  DELEGATION_MATRIX,
  MODEL_CATALOG,
  MODEL_TRANSPORT_PRIORITY,
  modelFamily,
  rejectLegacyLaneForNewSelection,
  selectEvaluator,
  validateDelegationMatrix,
  WORKLOAD_TIERS,
} from './delegation-matrix.ts';

Deno.test('owner matrix binds the five implementation tiers and coordinator routes', () => {
  assertEquals(WORKLOAD_TIERS, [
    'simple',
    'straightforward',
    'feature',
    'complex',
    'architecture',
  ]);
  assertEquals(DELEGATION_MATRIX.simple.implementation, [
    { model: 'luna', effort: 'max' },
    { model: 'qwen_3_8_flash_next', effort: 'provider_default' },
  ]);
  assertEquals(DELEGATION_MATRIX.feature.implementation[0], { model: 'astra', effort: 'low' });
  assertEquals(DELEGATION_MATRIX.complex.implementation[0], {
    model: 'astra',
    effort: 'medium',
  });
  assertEquals(DELEGATION_MATRIX.architecture.implementation[0], {
    model: 'astra',
    effort: 'xhigh',
  });
  assertEquals(COORDINATOR_MATRIX.framework, [
    { model: 'astra', effort: 'low' },
    { model: 'opus_5', effort: 'xhigh' },
  ]);
  assertEquals(COORDINATOR_MATRIX.milestone, [
    { model: 'astra', effort: 'medium' },
    { model: 'fable_5_1', effort: 'medium' },
    { model: 'opus_5', effort: 'xhigh' },
  ]);
});

Deno.test('provider priority puts subscriptions before metered OpenRouter', () => {
  assertEquals(MODEL_TRANSPORT_PRIORITY, [
    'claude',
    'codex',
    'agy',
    'opencode_go',
    'ollama',
    'openrouter',
  ]);
});

Deno.test('provider capability catalog pins dispatchable Claude and Ollama ids', () => {
  assertEquals(MODEL_CATALOG.fable_5_1.capabilities[0]?.model, ROUTING_MODEL_IDS.fable51Native);
  assertEquals(MODEL_CATALOG.opus_5.capabilities[0]?.model, ROUTING_MODEL_IDS.opus5Native);
  assertEquals(ROUTING_MODEL_IDS.fable51Native.startsWith('claude-fable-'), true);
  assertEquals(ROUTING_MODEL_IDS.opus5Native.startsWith('claude-opus-'), true);
  assertEquals(
    MODEL_CATALOG.deepseek_v4_flash.capabilities.find((entry) => entry.transport === 'ollama')
      ?.model.endsWith(':0731'),
    true,
  );
  assertEquals(
    MODEL_CATALOG.deepseek_v4_pro.capabilities.find((entry) => entry.transport === 'ollama')
      ?.model.endsWith(':0813'),
    true,
  );
});

Deno.test('vendor families distinguish open-model vendors', () => {
  assertEquals(modelFamily('astra'), 'openai');
  assertEquals(modelFamily('fable_5_1'), 'anthropic');
  assertEquals(modelFamily('muse_spark_1_3'), 'meta');
  assertEquals(modelFamily('glm_5_3'), 'zhipu');
  assertEquals(modelFamily('qwen_3_8_max'), 'alibaba');
  assertEquals(modelFamily('grok_4_6'), 'xai');
});

Deno.test('every generator candidate composes at least one different-family evaluator', () => {
  assertEquals(validateDelegationMatrix(), []);
});

Deno.test('same-family primary evaluator is skipped in favor of the declared fallback', () => {
  assertEquals(selectEvaluator('straightforward', 'implementation', 'glm_5_3_flash'), {
    model: 'deepseek_v4_pro',
    effort: 'max',
  });
  assertEquals(
    selectEvaluator('complex', 'plan', 'muse_spark_1_3', {
      authorizer: 'milestone_coordinator',
      rationale: 'Cross-package milestone design requires privileged review.',
    }),
    {
      model: 'grok_4_6',
      effort: 'high',
    },
  );
  assertEquals(selectEvaluator('feature', 'plan', 'fable_5_1'), {
    model: 'glm_5_3',
    effort: 'provider_default',
  });
});

Deno.test('complex and architecture rows require explicit owner or milestone authority', () => {
  assertThrows(
    () => selectEvaluator('complex', 'plan', 'muse_spark_1_3'),
    Error,
    'requires explicit owner or milestone-coordinator authorization',
  );
  assertThrows(
    () => selectEvaluator('architecture', 'implementation', 'astra'),
    Error,
    'requires explicit owner or milestone-coordinator authorization',
  );
});

Deno.test('a concrete provider model must belong to the selected matrix cell', () => {
  assertWorkloadModelAllowed(
    'feature',
    'implementation_evaluation',
    ROUTING_MODEL_IDS.museSpark13Go,
  );
  assertThrows(
    () =>
      assertWorkloadModelAllowed(
        'feature',
        'implementation_evaluation',
        ROUTING_MODEL_IDS.grok46Go,
      ),
    Error,
    'is not declared for feature/implementation_evaluation',
  );
});

Deno.test('evaluation limits preserve exact owner thresholds', () => {
  assertEquals(DELEGATION_MATRIX.simple.implementationPolicy.maxRounds, 'unspecified_by_owner');
  assertEquals(DELEGATION_MATRIX.straightforward.planPolicy, {
    maxRounds: 0,
    repairInFlightAt: 'immediate',
    reSteerSameSession: true,
  });
  assertEquals(DELEGATION_MATRIX.feature.planPolicy.maxRounds, 2);
  assertEquals(DELEGATION_MATRIX.feature.planPolicy.repairInFlightAt, 2);
  assertEquals(DELEGATION_MATRIX.complex.planPolicy.maxRounds, 3);
  assertEquals(DELEGATION_MATRIX.complex.planPolicy.repairInFlightAt, 3);
  assertEquals(DELEGATION_MATRIX.architecture.planPolicy, {
    maxRounds: 1,
    escalateToOwnerAt: 2,
    reSteerSameSession: true,
  });
  assertEquals(DELEGATION_MATRIX.feature.implementationPolicy.notifyOwnerAfter, 3);
  assertEquals(DELEGATION_MATRIX.architecture.implementationPolicy, {
    maxRounds: 3,
    notifyOwnerAfter: 2,
    reSteerSameSession: true,
  });
  for (const tier of WORKLOAD_TIERS) {
    assertEquals(DELEGATION_MATRIX[tier].documentationPolicy.maxRounds, 2);
  }
});

Deno.test('legacy lane names fail closed for new selection', () => {
  assertThrows(
    () => rejectLegacyLaneForNewSelection('normal_implementation'),
    Error,
    'deserialize-only',
  );
});
