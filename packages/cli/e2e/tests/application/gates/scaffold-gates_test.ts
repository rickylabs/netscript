import { assertEquals, assertThrows } from '@std/assert';

import { createSmokeProject } from '../../../src/application/builders/workspace/smoke-project-factory.ts';
import { createGeneratedCheckGates } from '../../../src/application/gates/scaffold/database-gates.ts';
import { createScaffoldGates } from '../../../src/application/gates/scaffold/scaffold-gates.ts';
import { GATE, SCAFFOLD } from '../../../src/domain/cli-surface.ts';
import {
  DATABASE,
  PACKAGE_SOURCE,
  PLUGIN,
  REPORT_FORMAT,
} from '../../../src/domain/extension-axes.ts';
import type { CommandGateDefinition } from '../../../src/domain/gate-definition.ts';
import type { RunContext, RunOptions } from '../../../src/domain/run-context.ts';

const PUBLISHED_TEST_VERSION = ['0', '0', '2'].join('.');

Deno.test('--source jsr accepts the local public CLI binary', () => {
  const command = scaffoldInitGate().command(
    createContext('/repo/packages/cli/bin/netscript.ts', PACKAGE_SOURCE.JSR),
  );

  assertEquals(command.slice(0, 4), ['deno', 'run', '-A', '/repo/packages/cli/bin/netscript.ts']);
});

Deno.test('scaffold init default command remains byte-identical', () => {
  assertEquals(
    scaffoldInitGate().command(
      createContext('/repo/packages/cli/bin/netscript.ts', PACKAGE_SOURCE.LOCAL),
    ),
    [
      'deno',
      'run',
      '-A',
      '/repo/packages/cli/bin/netscript.ts',
      'init',
      'prod-local-test',
      '--path',
      '/repo/.llm/tmp/cli-e2e',
      '--db',
      'postgres',
      '--service',
      '--service-name',
      'users',
      '--ci',
      '--yes',
      '--no-git',
      '--force',
    ],
  );
});

Deno.test('scaffold runtime exercises the generated service port default', () => {
  const command = scaffoldInitGate().command(
    createContext('/repo/packages/cli/bin/netscript.ts', PACKAGE_SOURCE.JSR),
  );

  assertEquals(command.includes('--service-port'), false);
  assertEquals(command.includes('3001'), false);
});

Deno.test('scaffold init disables the cache exactly once', () => {
  const command = scaffoldInitGate().command(
    createContext('/repo/packages/cli/bin/netscript.ts', PACKAGE_SOURCE.LOCAL, false),
  );

  assertEquals(command.filter((argument) => argument === '--cache=false'), ['--cache=false']);
});

Deno.test('--source jsr rejects the local contributor CLI binary', () => {
  assertThrows(
    () =>
      scaffoldInitGate().command(
        createContext('/repo/packages/cli/bin/netscript-dev.ts', PACKAGE_SOURCE.JSR),
      ),
    Error,
    '--source jsr requires --cli jsr:@netscript/cli@<version> or --cli packages/cli/bin/netscript.ts.',
  );
});

Deno.test('--source jsr generated check targets prod workspace members', () => {
  const gate = createGeneratedCheckGates().find((entry) => entry.id === GATE.GENERATED_DENO_CHECK);
  if (!gate || gate.kind !== 'command') {
    throw new Error('Expected generated check gate to be a command gate.');
  }

  assertEquals(
    gate.command(createContext('/repo/packages/cli/bin/netscript.ts', PACKAGE_SOURCE.JSR)),
    [
      'deno',
      'check',
      '--minimum-dependency-age=0',
      '--unstable-kv',
      './contracts',
      './database',
      './services/users',
    ],
  );
});

Deno.test('scaffold contract add gate targets the generated workspace', () => {
  const gate = createScaffoldGates({ plugins: [], samples: false }).find((entry) =>
    entry.id === GATE.CONTRACT_ADD
  );
  if (!gate || gate.kind !== 'command') {
    throw new Error('Expected contract add gate to be a command gate.');
  }

  assertEquals(
    gate.command(createContext('/repo/packages/cli/bin/netscript.ts', PACKAGE_SOURCE.LOCAL)),
    [
      'deno',
      'run',
      '-A',
      '/repo/packages/cli/bin/netscript.ts',
      'contract',
      'add',
      'catalog-items',
      '--path',
      '/repo/.llm/tmp/cli-e2e/prod-local-test',
    ],
  );
});

Deno.test('published AI lifecycle gate reuses the published CLI version', () => {
  const gate = createScaffoldGates({ plugins: [PLUGIN.AI], samples: false }).find((entry) =>
    entry.id === GATE.SCAFFOLD_PLUGIN_AI_LIFECYCLE
  );
  if (!gate || gate.kind !== 'command') {
    throw new Error('Expected AI lifecycle gate to be a command gate.');
  }

  const command = gate.command(
    createContext(`jsr:@netscript/cli@${PUBLISHED_TEST_VERSION}`, PACKAGE_SOURCE.JSR),
  );
  assertEquals(command, [
    'deno',
    'run',
    '-A',
    '--minimum-dependency-age=0',
    `https://jsr.io/@netscript/plugin-ai/${PUBLISHED_TEST_VERSION}/cli.ts`,
    'add',
    'tool',
    'e2e-tool',
    '--workspaceRoot=/repo/.llm/tmp/cli-e2e/prod-local-test',
  ]);
});

function scaffoldInitGate(): CommandGateDefinition {
  const gate = createScaffoldGates({ plugins: [], samples: false }).find((entry) =>
    entry.id === GATE.SCAFFOLD_INIT
  );
  if (!gate || gate.kind !== 'command') {
    throw new Error('Expected scaffold init gate to be a command gate.');
  }
  return gate;
}

function createContext(
  cliEntrypoint: string,
  packageSource: RunOptions['packageSource'],
  cache = true,
): RunContext {
  const options: RunOptions = {
    repoRoot: '/repo',
    cliEntrypoint,
    smokeRoot: '/repo/.llm/tmp/cli-e2e',
    projectName: 'prod-local-test',
    database: DATABASE.POSTGRES,
    packageSource,
    plugins: [],
    samples: false,
    cache,
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
