import { assertEquals, assertStrictEquals } from '@std/assert';
import { MODEL_CATALOG } from '@harness/matrix';
import { ROUTING_MODEL_IDS as HARNESS_MODEL_IDS } from '@harness/models';
import { MODEL_IDS, NATIVE_CANARY_MODEL_ARGS, ROUTING_MODEL_IDS } from './models.ts';
import { OPENCODE_GO_MODEL_MONTHLY_INCLUDED_USD } from './subscriptions.ts';

Deno.test('the local routing catalog is the same pinned Harness module', async () => {
  const config = JSON.parse(await Deno.readTextFile('deno.json')) as Readonly<{
    imports: Readonly<Record<string, string>>;
  }>;
  const matrix = config.imports['@harness/matrix'];
  const models = config.imports['@harness/models'];
  assertEquals(
    models,
    matrix.replace(/delegation-matrix\.ts$/, 'models.ts'),
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
