import { assert, assertEquals } from '@std/assert';
import {
  databaseGenerateEvidence,
  reportedRestartFailure,
} from './database-generate-diagnostic.ts';
import { CommandGate } from '../../../command-gate.ts';
import { createDatabaseGates } from '../../database-gates.ts';
import type { RunContext } from '../../../../../domain/run-context.ts';
import type { GateResult } from '../../../../../domain/gate-definition.ts';

const context: RunContext = {
  request: {
    suiteId: 'scaffold.runtime',
    options: {
      repoRoot: '/repo',
      cliEntrypoint: 'packages/cli/bin/netscript.ts',
      smokeRoot: '/repo/run',
      projectName: 'app',
      database: 'postgres',
      packageSource: 'local',
      plugins: [],
      samples: true,
      cache: true,
      cleanup: true,
      format: 'pretty',
      commandTimeoutMs: 900000,
      httpTimeoutMs: 30000,
    },
  },
  project: {
    repoRoot: '/repo',
    cliEntrypoint: 'packages/cli/bin/netscript.ts',
    smokeRoot: '/repo/run',
    projectName: 'app',
    projectRoot: '/repo/run/app',
    appHost: '/repo/run/app/aspire/apphost.mts',
  },
};
const appHost = context.project.appHost;
const failure =
  `Database client generated, but web restart failed (Aspire exit 16). summary\nRun: aspire resource web restart --apphost ${
    JSON.stringify(appHost)
  }`;

Deno.test('database generate remains the direct child; evidence follows original success failure and timeout settlement', async () => {
  const definition = createDatabaseGates().find((g) => g.id === 'database.generate');
  assert(definition?.kind === 'command');
  assert(definition.afterCommand);
  const expected = [
    'deno',
    'run',
    '-A',
    '/repo/packages/cli/bin/netscript.ts',
    'db',
    'generate',
    '--project-root',
    '/repo/run/app',
    '--db',
    'postgres',
  ];
  assertEquals(definition.command(context), expected);
  for (
    const outcome of [{ code: 0, timedOut: false }, { code: 1, timedOut: false }, {
      code: 124,
      timedOut: true,
    }]
  ) {
    let calls = 0, collected = 0, settled = false;
    const afterCommand = databaseGenerateEvidence((input) => {
      assert(settled);
      collected++;
      assertEquals(input.invocation.code, outcome.code);
      assertEquals(input.invocation.timedOut, outcome.timedOut);
      assertEquals(input.invocation.process, 'database_cli');
      assertEquals(
        input.invocation.reportedRestart,
        outcome.code === 1 ? { resource: 'web', exit: 16 } : undefined,
      );
      return Promise.reject(new Error('SECRET_COLLECTOR'));
    });
    const gate = new CommandGate({ ...definition, afterCommand }, {
      run: async (request) => {
        calls++;
        assertEquals(request.command, expected);
        assertEquals(request.timeoutMs, 900000);
        await Promise.resolve();
        settled = true;
        return {
          command: request.command,
          cwd: request.cwd,
          ...outcome,
          stdout: 'detail',
          stderr: outcome.code === 1 ? failure : '',
        };
      },
    });
    let thrown: unknown;
    let result: GateResult | undefined;
    try {
      result = await gate.execute(context);
    } catch (error) {
      thrown = error;
    }
    assertEquals(thrown, undefined, 'evidence collection must preserve original settlement');
    assert(result);
    assertEquals(result.verdict, outcome.code === 0 ? 'passed' : 'failed');
    assertEquals(result.attempts[0].exitCode, outcome.code);
    assertEquals(result.retried, false);
    assertEquals(calls, 1);
    assertEquals(collected, 1);
  }
});
Deno.test('nested restart result requires the exact reported target and never becomes a captured process status', () => {
  assertEquals(reportedRestartFailure(failure, appHost), { resource: 'web', exit: 16 });
  assertEquals(reportedRestartFailure(failure, '/foreign/apphost.mts'), undefined);
  assertEquals(reportedRestartFailure(failure.replace('exit 16', 'exit 999'), appHost), undefined);
});
