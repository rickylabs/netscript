import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { dirname, join } from 'jsr:@std/path@^1';

import { createUiAiGates } from '../../../../src/application/gates/scaffold/ui-ai-gates.ts';
import { ASPIRE_RESOURCE, GATE, SCAFFOLD } from '../../../../src/domain/cli-surface.ts';
import {
  DATABASE,
  PACKAGE_SOURCE,
  type PackageSource,
  REPORT_FORMAT,
} from '../../../../src/domain/extension-axes.ts';
import type { CommandGateDefinition } from '../../../../src/domain/gate-definition.ts';
import type { RunContext } from '../../../../src/domain/run-context.ts';

const REQUIRED_UI_PATHS = [
  'islands/ui/McpUiWidget.tsx',
  'assets/ui/mcp-ui-widget.css',
  'lib/ai/render-ui.tsx',
  'assets/styles.css',
  'assets/tokens.css',
  'assets/theme-bridge.css',
  'assets/tokens.json',
] as const;

Deno.test('ui AI gate rejects the old workspace-root layout and accepts the Fresh app layout', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-ui-ai-gate-' });
  try {
    const context = createContext(root);
    const gate = commandGate(GATE.SCAFFOLD_UI_LOCAL_SOURCE);
    await writeUiFixture(root);
    const appRoot = join(root, 'apps', ASPIRE_RESOURCE.APP);
    await Deno.mkdir(appRoot, { recursive: true });

    const oldLayout = await execute(gate, context);
    assertEquals(
      oldLayout.code,
      1,
      `The corrected gate accepted workspace-root UI files:\n${oldLayout.stderr}`,
    );

    await writeUiFixture(appRoot);
    const appLayout = await execute(gate, context);
    assertEquals(appLayout.code, 0, appLayout.stderr);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('ui AI install gate selects the generated Fresh app from the workspace', () => {
  const context = createContext('/repo/.llm/tmp/generated');
  const gate = commandGate(GATE.SCAFFOLD_UI_ADD_AI);
  const command = gate.command(context);

  assertEquals(gate.cwd(context), context.project.projectRoot);
  assertStringIncludes(command.join(' '), `--app ${ASPIRE_RESOURCE.APP}`);
  assertEquals(command.includes('--project-root'), false);
});

Deno.test('every UI AI assertion runs in the app and local imports stay workspace-relative', () => {
  const context = createContext('/repo/.llm/tmp/generated', PACKAGE_SOURCE.LOCAL);
  const expectedAppRoot = join(context.project.projectRoot, 'apps', ASPIRE_RESOURCE.APP);
  const appGateIds = [
    GATE.SCAFFOLD_UI_LOCAL_SOURCE,
    GATE.GENERATED_UI_AI_CHECK,
    GATE.BEHAVIOR_UI_RENDER,
    GATE.BEHAVIOR_MCP_WIDGET_ROUNDTRIP,
  ];

  for (const id of appGateIds) {
    assertEquals(commandGate(id).cwd(context), expectedAppRoot);
  }
  assertStringIncludes(
    commandGate(GATE.SCAFFOLD_UI_LOCAL_SOURCE).command(context).join(' '),
    '../../packages',
  );
  assertStringIncludes(
    commandGate(GATE.BEHAVIOR_MCP_WIDGET_ROUNDTRIP).command(context).join(' '),
    '../../packages/ai/mcp.ts',
  );
});

function commandGate(id: string): CommandGateDefinition {
  const gate = createUiAiGates().find((candidate) => candidate.id === id);
  if (!gate || gate.kind !== 'command') throw new Error(`${id} command gate missing`);
  return gate;
}

function createContext(
  projectRoot: string,
  packageSource: PackageSource = PACKAGE_SOURCE.JSR,
): RunContext {
  return {
    request: {
      suiteId: SCAFFOLD.RUNTIME,
      options: {
        repoRoot: '/repo',
        cliEntrypoint: 'packages/cli/bin/netscript.ts',
        smokeRoot: dirname(projectRoot),
        projectName: 'generated',
        database: DATABASE.POSTGRES,
        packageSource,
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

async function writeUiFixture(root: string): Promise<void> {
  for (const relativePath of REQUIRED_UI_PATHS) {
    const path = join(root, relativePath);
    await Deno.mkdir(dirname(path), { recursive: true });
    await Deno.writeTextFile(path, 'fixture\n');
  }
  await Deno.mkdir(root, { recursive: true });
  await Deno.writeTextFile(
    join(root, 'deno.json'),
    `${JSON.stringify({ imports: { '@netscript/ai': 'jsr:@netscript/ai@0.0.5' } }, null, 2)}\n`,
  );
}

async function execute(
  gate: CommandGateDefinition,
  context: RunContext,
): Promise<{ readonly code: number; readonly stderr: string }> {
  const command = gate.command(context);
  const output = await new Deno.Command(command[0], {
    args: command.slice(1),
    cwd: gate.cwd(context),
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  return {
    code: output.code,
    stderr: new TextDecoder().decode(output.stderr),
  };
}
