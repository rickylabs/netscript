import { assertEquals, assertStrictEquals } from '@std/assert';
import { MODEL_CATALOG } from '@harness/matrix';
import { ROUTING_MODEL_IDS as HARNESS_MODEL_IDS } from '@harness/models';
import {
  LEGACY_OPENROUTER_MODEL_IDS,
  MODEL_IDS,
  NATIVE_CANARY_MODEL_ARGS,
  OPENCODE_MODEL_IDS,
  OPENROUTER_MODEL_IDS,
  ROUTING_MODEL_IDS,
} from './models.ts';
import { OPENCODE_GO_MODEL_MONTHLY_INCLUDED_USD } from './subscriptions.ts';

Deno.test('the local routing catalog is the same pinned Harness module', async () => {
  const config = JSON.parse(await Deno.readTextFile('deno.json')) as Readonly<{
    imports: Readonly<Record<string, string>>;
    tasks: Readonly<Record<string, string>>;
  }>;
  const matrix = config.imports['@harness/matrix'];
  const models = config.imports['@harness/models'];
  assertEquals(
    models,
    matrix.replace(/delegation-matrix\.ts$/, 'models.ts'),
  );
  // The matrix viewer is Harness code at the same commit, so it always shows the matrix
  // NetScript routes with.
  assertEquals(
    config.tasks['agentic:matrix'],
    `deno run --no-lock ${matrix.replace(/delegation-matrix\.ts$/, 'cli/matrix-view.ts')}`,
  );
  assertStrictEquals(ROUTING_MODEL_IDS, HARNESS_MODEL_IDS);
  assertEquals(MODEL_IDS.codexSol, HARNESS_MODEL_IDS.solNative);
  assertEquals(MODEL_IDS.codexLuna, HARNESS_MODEL_IDS.lunaNative);
  assertEquals(MODEL_IDS.fable, HARNESS_MODEL_IDS.fable51Native);
  assertEquals(MODEL_IDS.opus, HARNESS_MODEL_IDS.opus55Native);
  assertEquals(NATIVE_CANARY_MODEL_ARGS.codex, HARNESS_MODEL_IDS.solNative);
  assertEquals(NATIVE_CANARY_MODEL_ARGS.claudeOpus, HARNESS_MODEL_IDS.opus55Native);
});

Deno.test('local OpenCode Go allowance caps cover the pinned Harness catalog exactly', () => {
  const goModels = [
    ...new Set(
      Object.values(MODEL_CATALOG).flatMap((model) =>
        model.capabilities.filter((capability) => capability.transport === 'opencode_go')
          .map((capability) => capability.model)
      ),
    ),
  ].sort();
  assertEquals(Object.keys(OPENCODE_GO_MODEL_MONTHLY_INCLUDED_USD).sort(), goModels);
});

Deno.test('local API approvals and evaluator aliases project the shared configuration', async () => {
  const { OPENROUTER_LAUNCHER_MODEL_IDS } = await import('@harness/openrouter-launcher-policy');
  assertStrictEquals(OPENROUTER_MODEL_IDS, OPENROUTER_LAUNCHER_MODEL_IDS);
  assertEquals(OPENROUTER_MODEL_IDS.grok, OPENCODE_MODEL_IDS.grok.slice('openrouter/'.length));
  assertEquals(
    OPENROUTER_MODEL_IDS.museSpark,
    OPENCODE_MODEL_IDS.museSpark.slice('openrouter/'.length),
  );
  assertEquals(
    Object.values(OPENROUTER_MODEL_IDS).includes(LEGACY_OPENROUTER_MODEL_IDS.grok45),
    false,
  );
  assertEquals(
    Object.values(OPENROUTER_MODEL_IDS).includes(
      ROUTING_MODEL_IDS.museSpark13OpenRouter.slice('openrouter/'.length),
    ),
    false,
  );
});
