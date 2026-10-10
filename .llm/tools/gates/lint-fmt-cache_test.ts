import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';

import { gateArgv } from './catalog.ts';
import { executeGate } from './command-lifecycle.ts';
import type { GateReceipt } from './contract.ts';
import { AtomicFileReceiptStore } from './receipt-store.ts';

const ROOT = new URL('../../../', import.meta.url);
const CASES = [
  { gate: 'lint', task: 'lint', wrapper: 'run-deno-lint.ts', invalid: 'debugger;\n' },
  {
    gate: 'fmt-check',
    task: 'fmt:check',
    wrapper: 'run-deno-fmt.ts',
    invalid: 'export const value=1;\n',
  },
] as const;

interface TaskDefinition {
  command: string;
  files: string[];
}

interface WorkspaceConfig {
  tasks: Record<string, TaskDefinition>;
  lint: unknown;
  fmt: unknown;
}

async function config(): Promise<WorkspaceConfig> {
  return JSON.parse(await Deno.readTextFile(new URL('deno.json', ROOT)));
}

// These task commands only quote the exclude regex; compare exact argv without a shell.
function taskArgv(command: string): string[] {
  return [...command.matchAll(/"([^"]*)"|(\S+)/g)].map((match) => match[1] ?? match[2]);
}

Deno.test('lint and format receipt gates preserve local task scope and caching', async () => {
  const workspace = await config();
  for (const { gate, task } of CASES) {
    const definition = workspace.tasks[task];
    assert(definition.files.length > 0, `${task} must keep local task caching`);
    assertEquals(gateArgv(gate), taskArgv(definition.command));
  }
});

async function runGate(
  root: string,
  gate: string,
  attempt: number,
  report: string,
): Promise<GateReceipt> {
  const receiptPath = join(root, `${gate}.receipt.json`);
  const receipt = await executeGate({
    gateId: gate,
    invocationId: `${gate}-${attempt}`,
    argv: gateArgv(gate, ['--output', report]),
    cwd: root,
    gitHead: 'fixture',
    actualGitHead: 'fixture',
    timeoutMs: 30_000,
    runnerIdentity: 'lint-fmt-cache-regression',
    attempt,
  }, {
    store: new AtomicFileReceiptStore(receiptPath),
    childReport: report,
  });
  assertEquals(JSON.parse(await Deno.readTextFile(receiptPath)), JSON.parse(JSON.stringify(receipt)));
  return receipt;
}

for (const { gate, task, wrapper, invalid } of CASES) {
  Deno.test(`${gate} writes fresh reports on repeated unchanged inputs and fails on violations`, async () => {
    const root = await Deno.makeTempDir({ prefix: 'lint-fmt-cache-' });
    try {
      const workspace = await config();
      await Deno.mkdir(join(root, 'packages', 'cache-fixture'), { recursive: true });
      await Deno.mkdir(join(root, 'plugins'));
      await Deno.mkdir(join(root, '.llm', 'tools'), { recursive: true });
      await Deno.copyFile(
        new URL(`.llm/tools/${wrapper}`, ROOT),
        join(root, '.llm', 'tools', wrapper),
      );
      await Deno.writeTextFile(
        join(root, 'deno.json'),
        JSON.stringify({
          tasks: { [task]: workspace.tasks[task] },
          lint: workspace.lint,
          fmt: workspace.fmt,
        }),
      );
      const source = join(root, 'packages', 'cache-fixture', 'mod.ts');
      const valid = 'export const value = 1;\n';
      await Deno.writeTextFile(source, valid);
      const report = join(root, 'report.json');

      // Populate the real task cache, then prove it would skip this exact CI invocation.
      for (const attempt of [1, 2]) {
        const primed = await new Deno.Command(Deno.execPath(), {
          args: ['task', task, '--output', report],
          cwd: root,
        }).output();
        const output = new TextDecoder().decode(primed.stdout) +
          new TextDecoder().decode(primed.stderr);
        assertEquals(primed.code, 0, output);
        if (attempt === 2) assertStringIncludes(output, 'cached, inputs unchanged');
      }

      // Each restored CI checkout lacks the prior report but retains unchanged task inputs.
      for (const attempt of [1, 2]) {
        await Deno.remove(report);
        const receipt = await runGate(root, gate, attempt, report);
        assertEquals(receipt.outcome, 'PASS', receipt.reason);
        assertEquals(receipt.exitCode, 0);
        assert(receipt.childReportEvidence, 'fresh child report must be hashed into the receipt');
        const child = JSON.parse(await Deno.readTextFile(report));
        assertEquals(child.coverage.filesProcessed, 1);
        assertEquals(child.coverage.refusals, []);
        assertEquals(await Deno.readTextFile(source), valid);
      }

      await Deno.writeTextFile(report, '{"stale":true}');
      const refreshed = await runGate(root, gate, 3, report);
      assertEquals(refreshed.outcome, 'PASS', refreshed.reason);
      assert(refreshed.childReportEvidence);
      assertEquals(JSON.parse(await Deno.readTextFile(report)).stale, undefined);

      await Deno.writeTextFile(source, invalid);
      const failed = await runGate(root, gate, 4, report);
      assertEquals(failed.outcome, 'FAIL');
      assert(failed.exitCode !== undefined && failed.exitCode > 0);
      assert(failed.childReportEvidence, 'violations must still produce a fresh failure report');
      const child = JSON.parse(await Deno.readTextFile(report));
      const findings = gate === 'lint' ? child.summary.totalOccurrences : child.summary.findings;
      assert(findings > 0, 'the real lint/format violation must appear in the report');
      assertEquals(await Deno.readTextFile(source), invalid, 'checks must never fix violations');
    } finally {
      await Deno.remove(root, { recursive: true });
    }
  });
}
