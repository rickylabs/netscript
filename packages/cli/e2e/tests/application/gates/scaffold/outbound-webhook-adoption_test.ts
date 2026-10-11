import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { walk } from '@std/fs/walk';
import { fromFileUrl, join, relative } from '@std/path';

import {
  createBehaviorPluginUnhealthyGates,
  createPluginRegistryGenerationGates,
} from '../../../../src/application/gates/scaffold/behavior-plugins-health-gate.ts';
import { createPluginContractGates } from '../../../../src/application/gates/scaffold/plugin-contract-gates.ts';
import { GATE, SCAFFOLD } from '../../../../src/domain/cli-surface.ts';
import type {
  CommandGateDefinition,
  GateDefinition,
} from '../../../../src/domain/gate-definition.ts';
import type { RunContext } from '../../../../src/domain/run-context.ts';
import { resolveSuite } from '../../../../src/presentation/cli/suites/registry.ts';

Deno.test('webhook adoption preserves project files and doctor state in any registry order', async (t) => {
  const repoRoot = fromFileUrl(new URL('../../../../../../../', import.meta.url));
  await Deno.mkdir(join(repoRoot, '.llm/tmp'), { recursive: true });
  const smokeRoot = await Deno.makeTempDir({
    dir: join(repoRoot, '.llm/tmp'),
    prefix: 'outbound-webhook-isolation-test-',
  });
  const projectRoot = join(smokeRoot, 'generated');
  const suite = resolveSuite(SCAFFOLD.RUNTIME, { repoRoot, smokeRoot, projectName: 'generated' });
  const context: RunContext = {
    request: { suiteId: suite.id, options: suite.defaultOptions },
    project: {
      repoRoot,
      smokeRoot,
      projectRoot,
      projectName: 'generated',
      cliEntrypoint: suite.defaultOptions.cliEntrypoint,
      appHost: join(projectRoot, 'aspire/apphost.mts'),
    },
  };
  const doctor = asCommand(createBehaviorPluginUnhealthyGates()[0]);
  // Run every adoption gate so the regression also detects a separate mutating generator.
  const adoption = createPluginContractGates()
    .filter((gate) => gate.id.endsWith('.outbound-webhook')).map(asCommand);
  assert(adoption.length > 0, 'Webhook adoption gate missing');
  try {
    for (const id of [GATE.SCAFFOLD_INIT, 'scaffold.plugin.worker', 'scaffold.plugin.saga']) {
      const gate = suite.gates.find((gate) => gate.id === id);
      if (!gate) throw new Error(`Missing setup gate ${id}`);
      const result = await execute(asCommand(gate), context);
      assertEquals(result.code, 0, result.stderr);
    }
    await t.step(
      'missing registries and repeat executions retain both remediation commands',
      async () => {
        const before = await execute(doctor, context);
        assertEquals(before.code, 1);
        for (const required of doctor.stdoutIncludes ?? []) {
          assertStringIncludes(before.stdout, required);
        }
        await assertUnchanged(0);
        await assertUnchanged(0);
      },
    );
    await t.step('generated registries remain unchanged when adoption runs afterward', async () => {
      for (const gate of createPluginRegistryGenerationGates()) {
        const result = await execute(asCommand(gate), context);
        assertEquals(result.code, 0, result.stderr);
      }
      const doctorResult = await execute(doctor, context);
      assertEquals(
        doctorResult.stdout.includes('deno run -A jsr:@netscript/plugin-workers@'),
        false,
      );
      assertEquals(doctorResult.stdout.includes('deno run -A jsr:@netscript/plugin-sagas@'), false);
      await assertUnchanged(0);
    });
    await t.step(
      'a failed adoption removes its scratch copy and preserves the project',
      async () => {
        await Deno.writeTextFile(
          join(projectRoot, 'workers/jobs/broken.ts'),
          'export const broken = ;',
        );
        await assertUnchanged(1);
      },
    );
  } finally {
    await Deno.remove(smokeRoot, { recursive: true });
  }

  async function assertUnchanged(expectedExitCode: number): Promise<void> {
    const before = await execute(doctor, context);
    // Doctor writes its own receipt. Snapshot after it, and compare before running it again.
    const files = await snapshot(projectRoot);
    const siblings = await directoryEntries(smokeRoot);
    for (const gate of adoption) {
      const result = await execute(gate, context);
      assertEquals(result.code, expectedExitCode, result.stderr);
      if (expectedExitCode === 0 && gate.id === GATE.BEHAVIOR_OUTBOUND_WEBHOOK) {
        assertStringIncludes(result.stdout, 'Generated outbound webhook adoption:');
      }
    }
    const afterFiles = await snapshot(projectRoot);
    assertEquals(afterFiles.size, files.size, 'Adoption changed original project files');
    for (const [path, hash] of files) {
      assertEquals(afterFiles.get(path), hash, `Adoption changed ${path}`);
    }
    assertEquals(await directoryEntries(smokeRoot), siblings, 'Adoption left a scratch project');
    const after = await execute(doctor, context);
    assertEquals(after.code, before.code);
    assertEquals(after.stdout, before.stdout, 'Adoption changed plugin doctor state');
  }
});

function asCommand(gate: GateDefinition): CommandGateDefinition {
  if (gate.kind !== 'command') throw new Error(`${gate.id} is not a command gate`);
  return gate;
}

async function execute(gate: CommandGateDefinition, context: RunContext) {
  const command = gate.command(context);
  const output = await new Deno.Command(command[0], {
    args: command.slice(1),
    cwd: gate.cwd(context),
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  return {
    code: output.code,
    stdout: new TextDecoder().decode(output.stdout),
    stderr: new TextDecoder().decode(output.stderr),
  };
}

async function snapshot(root: string): Promise<ReadonlyMap<string, string>> {
  const files = new Map<string, string>();
  for await (
    const entry of walk(root, {
      includeSymlinks: false,
      followSymlinks: false,
      skip: [/(?:^|[/\\])node_modules(?:[/\\]|$)/],
    })
  ) {
    const path = relative(root, entry.path);
    const hash = entry.isFile
      ? new Uint8Array(await crypto.subtle.digest('SHA-256', await Deno.readFile(entry.path)))
        .toHex()
      : 'directory';
    files.set(path, hash);
  }
  return files;
}

async function directoryEntries(root: string): Promise<readonly string[]> {
  const entries: string[] = [];
  for await (const entry of Deno.readDir(root)) entries.push(entry.name);
  return entries.sort();
}
