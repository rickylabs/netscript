import {
  readRoutingStates,
  renderCanonicalEvaluatorRoutes,
  renderRoutingStateHuman,
} from './routing-state.ts';
import { assertEquals, assertStringIncludes } from '@std/assert';

Deno.test('routing state human edge is finite for an empty machine-local store', async () => {
  const home = await Deno.makeTempDir();
  try {
    assertEquals(await readRoutingStates(home), []);
    assertEquals(renderRoutingStateHuman([]), 'No persisted routing transitions.');
  } finally {
    await Deno.remove(home, { recursive: true });
  }
});

Deno.test('routing state human edge renders evaluator routes derived from the new matrix', () => {
  const rendered = renderCanonicalEvaluatorRoutes();
  assertStringIncludes(rendered, 'Canonical evaluator routes:');
  assertStringIncludes(
    rendered,
    'straightforward/implementation_evaluation[0]: family=zhipu logical=glm_5_3_flash effort=provider_default',
  );
  assertStringIncludes(
    rendered,
    'feature/plan_evaluation[0]: family=zhipu logical=glm_5_3 effort=provider_default',
  );
  assertStringIncludes(
    rendered,
    'architecture/implementation_evaluation[0]: family=xai logical=grok_4_6 effort=xhigh',
  );
});
