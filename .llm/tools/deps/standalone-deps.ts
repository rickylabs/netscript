/** Repo-only routing keeps the shipped generic outdated/why tools byte-identical. */
import { basePinnedVersion, fetchLatestStable } from './latest.ts';
import {
  coverageNotice,
  printProjectReport,
  type ProjectResult,
  type Runner,
  runProcess,
  selectedProjectReport,
  standaloneCoverage,
} from './standalone-projects.ts';

export async function workspaceReport(
  operation: 'outdated' | 'why',
  args: string[],
  runner: Runner = runProcess,
): Promise<ProjectResult> {
  try {
    const output = await runner('deno', [
      'run',
      '--allow-read',
      '--allow-run',
      `.llm/tools/deps/${operation}.ts`,
      ...args.filter((arg) => arg !== '--pretty'),
    ], Deno.cwd());
    const report = JSON.parse(output.stdout);
    if (!report || typeof report !== 'object' || Array.isArray(report)) {
      throw new Error('Invalid JSON object');
    }
    return {
      exitCode: output.code,
      report: { ...report, standaloneCoverage: standaloneCoverage(operation) },
    };
  } catch (error) {
    return {
      exitCode: 3,
      report: {
        clean: false,
        error: `Workspace wrapper failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
    };
  }
}

async function main() {
  const [operation, ...args] = Deno.args;
  if (operation !== 'outdated' && operation !== 'why') {
    console.error('Expected outdated or why');
    Deno.exit(2);
  }
  if (args.includes('--help') || args.includes('-h')) {
    console.log(
      `deno task deps:${operation} [package] [--project tools/fresh-ui-browser] [--latest (outdated)] [--pretty]`,
    );
    return;
  }
  const selected = await selectedProjectReport(operation, args, {
    stable: { basePinnedVersion, fetchLatestStable },
  });
  if (selected) {
    printProjectReport(selected, args.includes('--pretty'));
    Deno.exit(selected.exitCode);
  }
  if (operation === 'why' && !args.some((arg) => !arg.startsWith('-'))) {
    printProjectReport({
      exitCode: 2,
      report: { clean: false, error: 'why requires a package name' },
    }, false);
    Deno.exit(2);
  }
  const result = await workspaceReport(operation, args);
  if (args.includes('--pretty')) {
    console.log(`deps:${operation} — workspace report`);
    console.log(coverageNotice(operation));
    if ('rows' in result.report && Array.isArray(result.report.rows)) {
      for (const row of result.report.rows) {
        console.log(
          `  ${row.package} ${row.current} → ${row.latest}${
            row.latestIsPrerelease ? ' [prerelease — use deps:latest]' : ''
          }`,
        );
      }
    } else console.log(JSON.stringify(result.report, null, 2));
  } else {
    console.log(JSON.stringify(result.report, null, 2));
  }
  Deno.exit(result.exitCode);
}

if (import.meta.main) await main();
