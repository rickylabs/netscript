import { assert, assertEquals } from '@std/assert';
import { dirname, fromFileUrl } from '@std/path';
import { compileJsdocExamples } from './jsdoc-example-compiler.ts';
import {
  analyzeJsdocExamples,
  formatJsdocExampleCensus,
  jsdocExampleRatchetFailures,
} from './jsdoc-example-policy.ts';

const repositoryRoot = dirname(dirname(dirname(dirname(fromFileUrl(import.meta.url)))));

// Original #1766 population: keep each example in the compile-only corpus even
// after its diagnostics disappear. A total coverage floor cannot detect a
// removed example when unrelated packages add examples in the same release.
const signatureExamples = [
  ['packages/contracts/src/application/transform-helpers.ts', 'createTransformer'],
  ['packages/telemetry/src/instrumentation/scheduler.ts', 'traceJobDispatch'],
  ['packages/telemetry/src/orpc/handler-context.ts', 'createTraceContext'],
  ['packages/auth-workos/mod.ts', undefined],
  ['packages/contracts/schemas/filters.ts', undefined],
  ['packages/ai/src/adapters/ollama.adapter.ts', 'OllamaModelProvider'],
  ['packages/aspire/src/application/resolve-env-vars.ts', 'buildOtelEnvVars'],
  ['packages/config/define-config.ts', 'defineConfig'],
  ['packages/config/define-config.ts', 'defineConfigAsync'],
  ['packages/config/loader.ts', 'loadConfig'],
  ['packages/database/adapters/mssql.adapter.ts', 'getMssqlConfig'],
  ['packages/database/adapters/mysql.adapter.ts', 'getMysqlConfig'],
  ['packages/database/extensions/sql-json.extension.ts', 'JsonField'],
  ['packages/fresh/src/application/route/types.ts', 'InferRoutePatternPath'],
  ['packages/kv/types/kv-store.ts', 'KvStore'],
  [
    'packages/plugin-streams-core/src/application/create-service-stream-producer.ts',
    'createServiceStreamProducer',
  ],
  ['packages/plugin/src/adapter/contract.ts', 'InstallStarterResource'],
  ['packages/plugin/src/adapter/contract.ts', 'InfoSpec'],
  ['packages/plugin/src/adapter/contract.ts', 'PluginResource'],
  ['packages/plugin/src/adapter/item/substitute.ts', 'TokenValues'],
] as const;

Deno.test('published JSDoc TypeScript examples compile against shipped entrypoints', async () => {
  const analysis = await analyzeJsdocExamples(repositoryRoot);
  for (const [sourcePath, symbol] of signatureExamples) {
    const blocks = analysis.blocks.filter((block) =>
      block.owner.sourcePath === sourcePath && block.owner.symbol === symbol &&
      block.exampleOrdinal === 1 && block.fenceOrdinal === 1
    );
    assertEquals(
      blocks.length,
      1,
      `#1766 example missing or duplicated: ${sourcePath} ${symbol ?? 'module'}`,
    );
    assertEquals(blocks[0].exemptionReason, undefined, `#1766 example exempted: ${sourcePath}`);
  }
  const result = await compileJsdocExamples(analysis, repositoryRoot);
  assertEquals(result.failureCensus.typeError, 0, result.diagnostics);
  const census = {
    ...analysis.census,
    failures: result.enforcedFailureCount,
  };
  const ratchetFailures = jsdocExampleRatchetFailures(analysis.census);
  assertEquals(
    { code: result.code, ratchetFailures },
    { code: 0, ratchetFailures: [] },
    `${formatJsdocExampleCensus(census, 'FAIL')}\n${
      JSON.stringify(result.failureCensus)
    }\n${result.diagnostics}`,
  );

  // Recreate the pre-#2239 user index-signature constraint against the real
  // SDK in the same published program. No API stubs or compiler suppressions.
  const workos = analysis.blocks.find((block) =>
    block.owner.sourcePath === 'packages/auth-workos/mod.ts'
  );
  assert(workos);
  const oldSignature = {
    ...workos,
    body: `${workos.body}
import type { WorkosSessionClient } from '@netscript/auth-workos';
const oldClient: WorkosSessionClient<{ readonly id: string; readonly [key: string]: unknown }> = workos;`,
  };
  const negative = await compileJsdocExamples({
    ...analysis,
    blocks: analysis.blocks.map((block) => block === workos ? oldSignature : block),
  }, repositoryRoot);
  assertEquals(negative.code, 1, negative.diagnostics);
  assertEquals(negative.enforcedFailureCount, 1, negative.diagnostics);
  assertEquals(negative.failureCensus.typeError, 1);
  assertEquals(negative.failureCensus.unboundName, 0);
  assertEquals(negative.typeErrorExamples[0].owner.sourcePath, workos.owner.sourcePath);
  assertEquals(negative.typeErrorExamples[0].tsCodes, [2322]);
  assert(result.rootLockUnchanged && negative.rootLockUnchanged);
});
