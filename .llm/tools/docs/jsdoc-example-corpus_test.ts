import { assertEquals } from '@std/assert';
import { dirname, fromFileUrl } from '@std/path';
import { compileJsdocExamples } from './jsdoc-example-compiler.ts';
import {
  analyzeJsdocExamples,
  formatJsdocExampleCensus,
  jsdocExampleRatchetFailures,
} from './jsdoc-example-policy.ts';

const repositoryRoot = dirname(dirname(dirname(dirname(fromFileUrl(import.meta.url)))));

Deno.test('published JSDoc TypeScript examples compile against shipped entrypoints', async () => {
  const analysis = await analyzeJsdocExamples(repositoryRoot);
  const result = await compileJsdocExamples(analysis, repositoryRoot);
  const census = {
    ...analysis.census,
    failures: result.enforcedFailureCount,
  };
  const ratchetFailures = jsdocExampleRatchetFailures(analysis.census, result.deferredExamples);
  assertEquals(
    { code: result.code, ratchetFailures },
    { code: 0, ratchetFailures: [] },
    `${formatJsdocExampleCensus(census, 'FAIL')}\n${
      JSON.stringify(result.failureCensus)
    }\n${result.diagnostics}`,
  );
});
