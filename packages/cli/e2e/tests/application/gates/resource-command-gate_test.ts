import { assertEquals } from '@std/assert';
import { resourceCommandContract } from '../../../src/application/gates/scaffold/runtime/evidence/resource-command.ts';
import { createResourceCommandGate } from '../../../src/application/gates/scaffold/runtime-gates.ts';
import type { RunContext } from '../../../src/domain/run-context.ts';

Deno.test('resource-command gate owns typed db command background restart describe and skip receipt', () => {
  assertEquals(resourceCommandContract(), {
    id: 'runtime.resource-command',
    typedDatabase: ['resource', '<db>-cli', 'migrate', '--timeout', '60'],
    background: [
      ['resource', 'workers', 'restart'],
      ['resource', 'sagas', 'restart'],
      ['resource', 'triggers', 'restart'],
    ],
    describe: ['describe', '--follow', '--format', 'Json'],
    skipWhenStartReceiptAbsent: true,
  });
});

Deno.test('resource-command gate registers an explicit absent-start skip receipt', () => {
  const gate = createResourceCommandGate();
  if (gate.kind !== 'command') throw new Error('Expected resource-command command gate.');
  assertEquals(gate.skip, { exitCode: 75, message: 'runtime.aspire-start receipt absent' });
  const context: RunContext = {
    request: {
      suiteId: 'scaffold.runtime',
      options: {
        repoRoot: '/repo',
        cliEntrypoint: 'packages/cli/bin/netscript.ts',
        smokeRoot: '/workspace',
        projectName: 'app',
        database: 'postgres',
        packageSource: 'local',
        plugins: [],
        samples: true,
        cache: true,
        cleanup: true,
        format: 'pretty',
        commandTimeoutMs: 900_000,
        httpTimeoutMs: 30_000,
      },
    },
    project: {
      repoRoot: '/repo',
      cliEntrypoint: 'packages/cli/bin/netscript.ts',
      smokeRoot: '/workspace',
      projectName: 'app',
      projectRoot: '/workspace/app',
      appHost: '/workspace/app/aspire/apphost.mts',
    },
  };
  assertEquals(
    gate.command(context).includes(
      '/repo/.llm/tmp/gate-receipts/scaffold.runtime/runtime.resource-command.json',
    ),
    true,
  );
});
