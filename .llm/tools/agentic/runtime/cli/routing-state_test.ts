import {
  readRoutingStates,
  renderCanonicalEvaluatorRoutes,
  renderRoutingStateHuman,
} from './routing-state.ts';
import { MODEL_IDS, OPENCODE_MODEL_IDS, OPENROUTER_MODEL_IDS } from '../../config/models.ts';
import { assertEquals as equal } from '@std/assert';

Deno.test('routing state human edge is finite for an empty machine-local store', async () => {
  const home = await Deno.makeTempDir();
  try {
    equal(await readRoutingStates(home), []);
    equal(renderRoutingStateHuman([]), 'No persisted routing transitions.');
  } finally {
    await Deno.remove(home, { recursive: true });
  }
});

Deno.test('routing state human edge renders canonical evaluator lanes', () => {
  equal(
    renderCanonicalEvaluatorRoutes(),
    [
      'Canonical evaluator routes:',
      `  adversarial_design_eval: condition=vision_evidence_complements_required_glm_design_review route=opencode/openrouter/${OPENCODE_MODEL_IDS.visionEval} effort=high`,
      `  formal_evaluation: policy=open_only route=claude/openrouter/${OPENROUTER_MODEL_IDS.qwen} effort=high`,
      `  review_claude: evaluates=anthropic route=codex/openai/${MODEL_IDS.codexSol} effort=xhigh`,
      `  review_codex_light: evaluates=openai route=claude/anthropic/${MODEL_IDS.opus} effort=high`,
      `  review_codex_light: evaluates=openai route=claude/anthropic/${MODEL_IDS.sonnet} effort=high`,
      `  review_codex: evaluates=openai route=claude/anthropic/${MODEL_IDS.fable} effort=low`,
      `  review_codex: evaluates=openai route=claude/anthropic/${MODEL_IDS.opus} effort=low`,
      `  review_codex_complex: evaluates=openai route=claude/anthropic/${MODEL_IDS.fable} effort=medium`,
      `  review_codex_complex: evaluates=openai route=claude/anthropic/${MODEL_IDS.opus} effort=medium`,
      `  review_codex_fast: evaluates=openai route=claude/anthropic/${MODEL_IDS.opus} effort=medium`,
      `  review_codex_fast: evaluates=openai route=claude/anthropic/${MODEL_IDS.sonnet} effort=high`,
    ].join('\n'),
  );
});
