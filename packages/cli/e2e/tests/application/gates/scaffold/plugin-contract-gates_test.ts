import { assertEquals, assertStringIncludes } from '@std/assert';
import { dirname, join } from '@std/path';

import { createPluginContractGates } from '../../../../src/application/gates/scaffold/plugin-contract-gates.ts';
import { GATE, SCAFFOLD } from '../../../../src/domain/cli-surface.ts';
import { DATABASE, PACKAGE_SOURCE, REPORT_FORMAT } from '../../../../src/domain/extension-axes.ts';
import type { CommandGateDefinition } from '../../../../src/domain/gate-definition.ts';
import type { RunContext } from '../../../../src/domain/run-context.ts';

Deno.test('plugin contract gates select runtime schemas and the complete AI namespace', () => {
  const context = createContext(
    '/repo/.llm/tmp/generated',
    'packages/cli/bin/netscript.ts',
    '/repo',
  );

  assertEquals(commandGate(GATE.GENERATED_RUNTIME_SCHEMAS).command(context), [
    'deno',
    'run',
    '-A',
    '/repo/packages/cli/bin/netscript.ts',
    'generate',
    'runtime-schemas',
    '--project-root',
    context.project.projectRoot,
  ]);
  assertEquals(commandGate(GATE.GENERATED_AI_NAMESPACE_CHECK).command(context), [
    'deno',
    'check',
    '--unstable-kv',
    './ai',
  ]);
});

Deno.test('AI appsettings gate rejects only service configuration attributed to AI', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-ai-appsettings-gate-' });
  try {
    const context = createContext(root);
    const gate = commandGate(GATE.SCAFFOLD_PLUGIN_AI_APPSETTINGS);
    await Deno.writeTextFile(
      join(root, 'appsettings.json'),
      JSON.stringify({
        NetScript: {
          Plugins: {
            auth: { Entrypoint: 'jsr:@netscript/plugin-auth@0.0.5/services' },
          },
        },
      }),
    );
    assertEquals((await execute(gate, context)).code, 0);

    await Deno.writeTextFile(
      join(root, 'appsettings.json'),
      JSON.stringify({
        NetScript: {
          Plugins: {
            ai: { Entrypoint: 'jsr:@netscript/plugin-ai@0.0.5/services' },
          },
        },
      }),
    );
    const invalid = await execute(gate, context);
    assertEquals(invalid.code, 1);
    assertStringIncludes(invalid.stderr, 'NetScript.Plugins.ai');

    await Deno.writeTextFile(
      join(root, 'appsettings.json'),
      JSON.stringify({
        NetScript: { Plugins: {} },
        probe: 'jsr:@netscript/plugin-ai@0.0.5/services',
      }),
    );
    const synthesized = await execute(gate, context);
    assertEquals(synthesized.code, 1);
    assertStringIncludes(synthesized.stderr, 'synthesized a /services specifier');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('doctor negative gate observes failure and restores the configured module', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-doctor-negative-gate-' });
  try {
    const context = createContext(root, 'fake-cli.ts');
    const modulePath = join(root, 'ai', 'mod.ts');
    await Deno.mkdir(dirname(modulePath), { recursive: true });
    await Deno.writeTextFile(modulePath, 'export const manifest = {};\n');
    await Deno.writeTextFile(
      join(root, 'fake-cli.ts'),
      [
        `const modulePath = ${JSON.stringify(modulePath)};`,
        'try {',
        '  await Deno.stat(modulePath);',
        '  Deno.exit(0);',
        '} catch (error) {',
        '  if (error instanceof Deno.errors.NotFound) Deno.exit(1);',
        '  throw error;',
        '}',
      ].join('\n'),
    );

    const result = await execute(
      commandGate(GATE.BEHAVIOR_PLUGIN_DOCTOR_MISSING_MODULE),
      context,
    );
    assertEquals(result.code, 0, result.stderr);
    assertEquals(await Deno.readTextFile(modulePath), 'export const manifest = {};\n');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

function commandGate(id: string): CommandGateDefinition {
  const gate = createPluginContractGates().find((candidate) => candidate.id === id);
  if (!gate || gate.kind !== 'command') throw new Error(`${id} command gate missing`);
  return gate;
}

function createContext(
  projectRoot: string,
  cliEntrypoint = 'packages/cli/bin/netscript.ts',
  repoRoot = projectRoot,
): RunContext {
  return {
    request: {
      suiteId: SCAFFOLD.RUNTIME,
      options: {
        repoRoot,
        cliEntrypoint,
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
      repoRoot,
      cliEntrypoint,
      smokeRoot: dirname(projectRoot),
      projectName: 'generated',
      projectRoot,
      appHost: join(projectRoot, 'aspire', 'apphost.mts'),
    },
  };
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
