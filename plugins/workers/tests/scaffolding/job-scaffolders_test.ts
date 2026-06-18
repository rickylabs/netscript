import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { JobBuilderScaffolder } from '../../src/scaffolding/job-scaffolders.ts';

Deno.test('JobBuilderScaffolder does not emit deprecated recurring-job API', async () => {
  const source = await new JobBuilderScaffolder().generate({
    id: 'nightly-report',
    topic: 'workers.reports',
    schedule: '0 2 * * *',
    timeoutMs: 60_000,
    maxRetries: 2,
    tags: ['reports'],
  });

  assertStringIncludes(source, 'defineJob("nightly-report")');
  assertStringIncludes(source, '.topic("workers.reports")');
  assertStringIncludes(source, '.timeout(60000)');
  assertStringIncludes(source, '.retry(2)');
  assertEquals(source.includes('.sched' + 'ule('), false);
});
