import { documentedScaffoldCommand } from '../../verify-documented-scaffold.ts';
import { assert, assertEquals } from '@std/assert';
import {
  databaseGenerateEvidence,
  documentedDatabaseGenerateEvidence,
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

Deno.test('documented database command observes original native output without replacing failure or running another child', async () => {
  const scope = { projectRoot: context.project.projectRoot, appHost, runnerRoot: '/repo' };
  let calls = 0, collections = 0, settled = false;
  const words = ['netscript', 'db', 'generate'];
  const args = ['run', '-A', '/repo/cli.ts', ...words.slice(1)];
  const collect: Parameters<typeof documentedDatabaseGenerateEvidence>[2] = (input) => {
    assert(settled);
    collections++;
    assertEquals(input.projectRoot, scope.projectRoot);
    assertEquals(input.runnerRoot, '/repo');
    assertEquals(input.invocation.code, 1);
    assertEquals(input.invocation.reportedRestart, { resource: 'web', exit: 16 });
    return Promise.reject(new Error('SECRET_DIAGNOSTIC_FAILURE'));
  };
  let failure: unknown;
  try {
    await documentedScaffoldCommand(words, words.slice(1), {
      ...scope,
      cwd: scope.projectRoot,
      cliEntrypoint: '/repo/cli.ts',
      repoRoot: '/repo',
    }, {
      collect,
      execute: (program, options) => {
        calls++;
        assertEquals(program, Deno.execPath());
        assertEquals(options.args, args);
        assertEquals(options.cwd, scope.projectRoot);
        assertEquals(options.stdin, 'null');
        assertEquals(options.stdout, 'piped');
        assertEquals(options.stderr, 'piped');
        assert(options.signal);
        settled = true;
        return Promise.resolve({
          code: 1,
          signal: null,
          success: false,
          stdout: new TextEncoder().encode('original stdout'),
          stderr: new TextEncoder().encode(failureText),
        });
      },
    });
  } catch (error) {
    failure = error;
  }
  assert(failure instanceof Error);
  assertEquals(
    failure.message,
    `${Deno.execPath()} ${args.join(' ')} exited 1: ${failureText}\noriginal stdout`,
  );
  assertEquals(calls, 1);
  assertEquals(collections, 1);
  for (
    const other of [['netscript', 'db', 'seed'], ['aspire', 'start'], ['deno', 'db', 'generate']]
  ) {
    assertEquals(documentedDatabaseGenerateEvidence(other, scope), undefined);
  }
});
const failureText = failure;

Deno.test('documented command keeps successful output and original native rejection when diagnostics are unavailable', async () => {
  const words = ['netscript', 'db', 'generate'];
  const input = {
    cwd: '/repo/run/app',
    projectRoot: '/repo/run/app',
    appHost,
    repoRoot: '/repo',
    cliEntrypoint: '/repo/cli.ts',
  };
  let calls = 0, collections = 0;
  const success = await documentedScaffoldCommand(words, words.slice(1), input, {
    execute: () => {
      calls++;
      return Promise.resolve({
        code: 0,
        signal: null,
        success: true,
        stdout: new TextEncoder().encode('original success'),
        stderr: new Uint8Array(),
      });
    },
    collect: () => {
      collections++;
      return Promise.reject(new Error('SECRET_COLLECTOR'));
    },
  });
  assertEquals(success, 'original success');
  assertEquals(calls, 1);
  assertEquals(collections, 1);
  const original = new Error('fixture_native_rejection');
  let caught: unknown;
  try {
    await documentedScaffoldCommand(words, words.slice(1), input, {
      execute: () => {
        calls++;
        return Promise.reject(original);
      },
      collect: () => {
        collections++;
        return Promise.resolve();
      },
    });
  } catch (error) {
    caught = error;
  }
  assertEquals(caught, original);
  assertEquals(calls, 2);
  assertEquals(collections, 1);
});
