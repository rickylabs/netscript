import { assertEquals } from '@std/assert';
import { createCliProgram } from '../../src/presentation/cli/cli-program.ts';
import { SCAFFOLD } from '../../src/domain/cli-surface.ts';
import { DATABASE } from '../../src/domain/extension-axes.ts';
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

Deno.test('full CLI command accepts run options and runs runtime suite', async () => {
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

  await command.parse(['full', '--format', 'pretty', '--cleanup']);

  assertEquals(calls.length, 1);
  assertEquals(calls[0].suite.id, SCAFFOLD.RUNTIME);
  assertEquals(calls[0].request.suiteId, SCAFFOLD.RUNTIME);
  assertEquals(calls[0].request.options.database, DATABASE.POSTGRES);
  assertEquals(calls[0].request.options.cache, true);
  assertEquals(calls[0].request.options.format, 'pretty');
  assertEquals(calls[0].request.options.cleanup, true);
});

Deno.test('run command lets sqlite runtime suite defaults win unless flags override them', async () => {
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

  await command.parse(['run', SCAFFOLD.RUNTIME_SQLITE]);

  assertEquals(calls.length, 1);
  assertEquals(calls[0].suite.id, SCAFFOLD.RUNTIME_SQLITE);
  assertEquals(calls[0].request.options.database, DATABASE.SQLITE);
  assertEquals(calls[0].request.options.cache, false);
});

Deno.test('run command keeps explicit postgres above sqlite runtime suite default', async () => {
  const calls: Array<{ request: RunRequest; options: RunOptions }> = [];
  const command = createCliProgram((options) => ({
    run(_suite, request): Promise<RunReport> {
      calls.push({ request, options });
      return Promise.resolve({
        ok: true,
        suiteId: request.suiteId,
        projectRoot: options.smokeRoot,
        startedAt: new Date(0).toISOString(),
        durationMs: 0,
        steps: [],
        summary: { passed: 0, failed: 0, skipped: 0 },
      });
    },
  }));

  await command.parse(['run', SCAFFOLD.RUNTIME_SQLITE, '--db', DATABASE.POSTGRES]);

  assertEquals(calls.length, 1);
  assertEquals(calls[0].request.options.database, DATABASE.POSTGRES);
  assertEquals(calls[0].options.database, DATABASE.POSTGRES);
  assertEquals(calls[0].options.cache, false);
});
