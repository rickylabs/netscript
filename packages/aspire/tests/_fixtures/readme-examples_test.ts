import { assertEquals, assertStringIncludes } from '@std/assert';
import { inspectAspire } from '../../mod.ts';
import { composeAppHost } from '../../src/application/mod.ts';
import {
  createContributionContextFixture,
  ExampleAspireContribution,
  MemoryAspireBuilder,
} from '../../src/testing/mod.ts';

Deno.test('README composition example creates an inspectable resource graph', () => {
  const builder = new MemoryAspireBuilder();
  const result = composeAppHost({
    builder,
    context: createContributionContextFixture(),
    plugins: [{
      name: '@example/plugin',
      contributions: { aspire: ExampleAspireContribution },
    }],
  });
  const report = inspectAspire(builder);

  assertEquals(result.resources.length, 1);
  assertStringIncludes(report.summary, 'Aspire composition');
});
