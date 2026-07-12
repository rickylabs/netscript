import {
  readRoutingStates,
  renderCanonicalEvaluatorRoutes,
  renderRoutingStateHuman,
} from './routing-state.ts';
import { MODEL_IDS, OPENROUTER_MODEL_IDS } from '../../config/models.ts';
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

Deno.test('routing state human edge renders formal evaluation and ordinary review lanes', () => {
  equal(
    renderCanonicalEvaluatorRoutes(),
    [
      'Canonical evaluator routes:',
      `  formal_evaluation: policy=open_only route=claude/openrouter/${OPENROUTER_MODEL_IDS.qwen} effort=high`,
      `  review_claude: evaluates=anthropic route=codex/openai/${MODEL_IDS.codexSol} effort=xhigh`,
      `  review_codex: evaluates=openai route=claude/anthropic/${MODEL_IDS.opus} effort=high`,
    ].join('\n'),
  );
});
