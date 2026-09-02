import { assert, assertEquals } from '@std/assert';
import { gateArgv } from './catalog.ts';

interface RootConfig {
  tasks?: Record<string, unknown>;
}

Deno.test('JSDoc example gate plumbing and blocking quality placement are exact', async () => {
  const config = JSON.parse(await Deno.readTextFile('deno.json')) as RootConfig;
  assertEquals(
    config.tasks?.['docs:jsdoc-examples'],
    'deno run --allow-read --allow-write --allow-run .llm/tools/docs/check-jsdoc-examples.ts',
  );
  assertEquals(
    config.tasks?.['docs:jsdoc-examples:test'],
    'deno test --allow-read --allow-write --allow-run .llm/tools/docs/jsdoc-example-policy_test.ts .llm/tools/docs/jsdoc-example-compiler_test.ts .llm/tools/gates/jsdoc-example-workflow_test.ts',
  );
  assertEquals(gateArgv('jsdoc-example-compile'), [
    'deno',
    'task',
    'docs:jsdoc-examples',
  ]);

  const workflow = await Deno.readTextFile('.github/workflows/ci.yml');
  const gateOccurrences = [...workflow.matchAll(/--gate jsdoc-example-compile/g)];
  assertEquals(gateOccurrences.length, 1);
  const qualityStart = workflow.indexOf('\n  quality:');
  const depsReportStart = workflow.indexOf('\n  deps-report:');
  const gatePosition = gateOccurrences[0]?.index ?? -1;
  assert(
    qualityStart !== -1 && gatePosition > qualityStart && gatePosition < depsReportStart,
    'the blocking example gate must appear exactly once in the quality job',
  );
  assert(
    workflow.includes(
      "- name: JSDoc example import and fence integrity\n        if: env.RUN_DENO == 'true'",
    ),
    'the gate must use the Deno quality classifier surface',
  );
  assert(
    workflow.includes(
      '--id quality-jsdoc-example-compile\n          --output .llm/tmp/gate-receipts/quality/jsdoc-example-compile.json',
    ),
    'the blocking gate must emit its durable quality receipt',
  );
});
