import { parseArgs } from 'jsr:@std/cli@1/parse-args';
import { dirname } from 'jsr:@std/path@1/dirname';
import { runLibraryCommand } from './cli.ts';

const source = 'tools/figma-component-library';
const wrapper = (
  name: string,
): string[] => [
  'run',
  '--allow-read',
  '--allow-write',
  '--allow-run',
  `.llm/tools/run-deno-${name}.ts`,
];
const commands: readonly { readonly gate: string; readonly args: readonly string[] }[] = [
  {
    gate: 'check',
    args: [...wrapper('check'), '--root', source, '--ext', 'ts', '--deno-arg', '--frozen'],
  },
  {
    gate: 'lint',
    args: [
      ...wrapper('lint'),
      '--root',
      source,
      '--ext',
      'ts',
      '--config',
      `${source}/lint.deno.json`,
    ],
  },
  {
    gate: 'format',
    args: [
      ...wrapper('fmt'),
      '--root',
      source,
      '--ext',
      'ts',
      '--config',
      `${source}/lint.deno.json`,
    ],
  },
  {
    gate: 'test',
    args: [...wrapper('test'), '--', '--allow-all', '--unstable-kv', '--frozen', `${source}/tests`],
  },
  {
    gate: 'quality',
    args: [
      'run',
      '--allow-read',
      '.llm/tools/quality/scan-code-quality.ts',
      '--root',
      source,
      '--max-allow',
      '0',
    ],
  },
  {
    gate: 'build',
    args: ['run', '--frozen', '--allow-read', '--allow-write', '--allow-run', `${source}/build.ts`],
  },
];

/** Run the declared scoped wrappers and native build; inventory readiness remains a separate fact. */
export async function runComponentLibraryCi(reportPath?: string): Promise<boolean> {
  const results: {
    gate: string;
    exitCode: number;
    summary?: unknown;
    selection?: unknown;
    coverage?: unknown;
  }[] = [];
  for (const command of commands) {
    const output = await new Deno.Command(Deno.execPath(), {
      args: [...command.args],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    await Deno.stdout.write(output.stdout);
    await Deno.stderr.write(output.stderr);
    const result: {
      gate: string;
      exitCode: number;
      summary?: unknown;
      selection?: unknown;
      coverage?: unknown;
    } = { gate: command.gate, exitCode: output.code };
    if (['check', 'lint', 'format', 'test'].includes(command.gate)) {
      try {
        const report: unknown = JSON.parse(new TextDecoder().decode(output.stdout));
        if (typeof report !== 'object' || report === null || !('summary' in report)) {
          throw new Error('Missing structured wrapper report');
        }
        result.summary = report.summary;
        if ('selection' in report) result.selection = report.selection;
        if ('coverage' in report) result.coverage = report.coverage;
      } catch {
        result.exitCode ||= 1;
        console.error(`${command.gate}: missing structured wrapper report`);
      }
    }
    results.push(result);
  }
  const inventory = await runLibraryCommand(['inventory']);
  const ok = results.every((result) => result.exitCode === 0);
  const report = {
    schemaVersion: 1,
    scope: 'pipeline-fixtures-and-current-source-audit',
    ok,
    fullInventoryReady: inventory.ok,
    inventory,
    gates: results,
    liveEditor: 'UNPROVEN',
    mcp: 'UNPROVEN',
    publication: 'UNPROVEN',
  };
  const text = JSON.stringify(report, null, 2) + '\n';
  if (reportPath) {
    await Deno.mkdir(dirname(reportPath), { recursive: true });
    await Deno.writeTextFile(`${reportPath}.tmp`, text);
    await Deno.rename(`${reportPath}.tmp`, reportPath);
  }
  console.log(text);
  return ok;
}

if (import.meta.main) {
  const flags = parseArgs(Deno.args, {
    string: ['report'],
    unknown: (flag) => {
      throw new Error(`Unknown CI argument: ${flag}`);
    },
  });
  if (!await runComponentLibraryCi(flags.report)) Deno.exitCode = 1;
}
