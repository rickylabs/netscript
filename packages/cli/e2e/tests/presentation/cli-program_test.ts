import { assertEquals } from '@std/assert';
import { createCliProgram } from '../../src/presentation/cli/cli-program.ts';
import { SCAFFOLD } from '../../src/domain/cli-surface.ts';
import type { RunOptions, RunRequest } from '../../src/domain/run-context.ts';
import type { RunReport } from '../../src/domain/report.ts';
import type { SuiteDefinition } from '../../src/domain/suite-definition.ts';

Deno.test('bare CLI command runs the full scaffold runtime suite with cleanup', async () => {
  const calls: Array<{ suite: SuiteDefinition; request: RunRequest; options: RunOptions }> = [];
  const command = createCliProgram((options) => ({
    run(suite, request): Promise<RunReport> {
      calls.push({ suite, request, options });
      return Promise.resolve({
        ok: true,
        suiteId: suite.id,
        projectRoot: options.smokeRoot,
        startedAt: new Date(0).toISOString(),
        durationMs: 0,
        steps: [],
        summary: { passed: 0, failed: 0, skipped: 0 },
      });
    },
  }));

  await command.parse([]);

  assertEquals(calls.length, 1);
  assertEquals(calls[0].suite.id, SCAFFOLD.RUNTIME);
  assertEquals(calls[0].request.suiteId, SCAFFOLD.RUNTIME);
  assertEquals(calls[0].request.options.cleanup, true);
  assertEquals(calls[0].options.cleanup, true);
});
