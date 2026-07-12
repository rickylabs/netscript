import { assertEquals } from 'jsr:@std/assert@^1';
import { defineJob } from '../../src/builders/mod.ts';
import {
  InProcessJobDispatcher,
  type JobContext,
  type JobDefinition,
  type JobResult,
} from '../../src/runtime/mod.ts';

Deno.test('InProcessJobDispatcher imports sourceUrl before entrypoint for plugin jobs', async () => {
  const importedSpecifiers: string[] = [];
  const dispatcher = new InProcessJobDispatcher({
    fallbackToDynamicImport: true,
    importModule: (specifier) => {
      importedSpecifiers.push(specifier);
      return Promise.resolve({
        default: (_context: JobContext): JobResult<Record<string, boolean>> => ({
          success: true,
          data: { ok: true },
        }),
      });
    },
  });
  const job = {
    ...defineJob('workers-plugin-health-check').entrypoint('./jobs/health-check.ts').build(),
    sourceUrl: 'jsr:@netscript/plugin-workers/jobs/health-check.ts',
    source: 'plugin',
    executionType: 'deno',
  } satisfies JobDefinition;

  const result = await dispatcher.dispatch(job, {
    id: job.id,
    job,
    payload: {},
  });

  assertEquals(result, { success: true, data: { ok: true } });
  assertEquals(importedSpecifiers, ['jsr:@netscript/plugin-workers/jobs/health-check.ts']);
});
