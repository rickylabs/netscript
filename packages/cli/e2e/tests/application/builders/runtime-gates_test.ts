import { assertEquals } from '@std/assert';

import { createSmokeProject } from '../../../src/application/builders/workspace/smoke-project-factory.ts';
import { createRuntimeGates } from '../../../src/application/gates/scaffold/runtime-gates.ts';
import { GATE, SCAFFOLD } from '../../../src/domain/cli-surface.ts';
import {
  DATABASE,
  PACKAGE_SOURCE,
  PLUGIN,
  REPORT_FORMAT,
} from '../../../src/domain/extension-axes.ts';
import type { RunContext, RunOptions } from '../../../src/domain/run-context.ts';

Deno.test('runtime aspire start gate discards detached command output', () => {
  const gate = createRuntimeGates().find((entry) => entry.id === GATE.RUNTIME_ASPIRE_START);

  assertEquals(gate?.kind, 'command');
  if (gate?.kind !== 'command') {
    throw new Error('Expected runtime aspire start gate to be a command gate.');
  }

  assertEquals(gate.outputMode, 'discard');
  assertEquals(
    gate.failureHint,
    'Aspire start ran with discarded output. Check the detached-child log under ~/.aspire/logs or rerun the command manually for full diagnostics.',
  );
});

Deno.test('runtime database wait gate targets mssql with extended timeout', () => {
  const gate = createRuntimeGates().find((entry) => entry.id === GATE.RUNTIME_WAIT_DATABASE);
  if (gate?.kind !== 'command') {
    throw new Error('Expected active database wait gate to be a command gate.');
  }

  assertEquals(gate.command(createContext(DATABASE.MSSQL)), [
    'aspire',
    'wait',
    'mssql',
    '--status',
    'healthy',
    '--timeout',
    '600',
    '--apphost',
    '/repo/.llm/tmp/cli-e2e/runtime-wait-test/aspire/apphost.mts',
    '--non-interactive',
    '--nologo',
  ]);
});

function createContext(database: RunOptions['database']): RunContext {
  const options: RunOptions = {
    repoRoot: '/repo',
    cliEntrypoint: '/repo/packages/cli/bin/netscript-dev.ts',
    smokeRoot: '/repo/.llm/tmp/cli-e2e',
    projectName: 'runtime-wait-test',
    database,
    packageSource: PACKAGE_SOURCE.LOCAL,
    plugins: [PLUGIN.WORKER],
    samples: true,
    cleanup: true,
    format: REPORT_FORMAT.PRETTY,
    commandTimeoutMs: 1,
    httpTimeoutMs: 1,
  };
  return {
    request: {
      suiteId: SCAFFOLD.RUNTIME,
      options,
    },
    project: createSmokeProject(options),
  };
}
