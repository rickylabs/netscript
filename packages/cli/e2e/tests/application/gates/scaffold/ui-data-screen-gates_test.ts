import { assertEquals, assertExists, assertStringIncludes } from '@std/assert';
import { dirname, join } from '@std/path';

import { createScaffoldCapabilityGates } from '../../../../src/application/gates/scaffold/scaffold-capability-gates.ts';
import { type GateId, SCAFFOLD } from '../../../../src/domain/cli-surface.ts';
import { DATABASE, PACKAGE_SOURCE, REPORT_FORMAT } from '../../../../src/domain/extension-axes.ts';
import type { CommandGateDefinition } from '../../../../src/domain/gate-definition.ts';
import type { RunContext } from '../../../../src/domain/run-context.ts';

const UI_DATA_SCREEN_GATE_ID = 'scaffold.ui-data-screen' as GateId;

Deno.test('scaffold capability gates register the generated data-screen consumer', () => {
  const gate = dataScreenGate();

  assertExists(gate);
  assertEquals(gate.phase, 'scaffold');
  assertEquals(gate.critical, true);
});

Deno.test('data-screen gate invokes ui:add against the generated Fresh app', () => {
  const context = createContext('/repo/.llm/tmp/generated');
  const gate = dataScreenGate();
  assertExists(gate);

  assertEquals(gate.cwd(context), context.project.projectRoot);
  const command = gate.command(context).join(' ');
  assertStringIncludes(command, 'ui:add page data-screen --island');
  assertStringIncludes(command, '--app generated-web');
});

function dataScreenGate(): CommandGateDefinition | undefined {
  const gate = createScaffoldCapabilityGates({
    plugins: [],
    samples: false,
  }).find((candidate) => candidate.id === UI_DATA_SCREEN_GATE_ID);
  return gate?.kind === 'command' ? gate : undefined;
}

function createContext(projectRoot: string): RunContext {
  return {
    request: {
      suiteId: SCAFFOLD.RUNTIME,
      options: {
        repoRoot: '/repo',
        cliEntrypoint: 'packages/cli/bin/netscript.ts',
        smokeRoot: dirname(projectRoot),
        projectName: 'generated',
        database: DATABASE.POSTGRES,
        packageSource: PACKAGE_SOURCE.LOCAL,
        plugins: [],
        samples: false,
        cache: false,
        cleanup: true,
        format: REPORT_FORMAT.PRETTY,
        commandTimeoutMs: 30_000,
        httpTimeoutMs: 10_000,
      },
    },
    project: {
      repoRoot: '/repo',
      cliEntrypoint: 'packages/cli/bin/netscript.ts',
      smokeRoot: dirname(projectRoot),
      projectName: 'generated',
      projectRoot,
      appHost: join(projectRoot, 'aspire', 'apphost.mts'),
    },
  };
}
