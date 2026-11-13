/** Repository-owned npm tools are inspected separately from the Deno workspace. */
import { greaterThan, parse } from 'jsr:@std/semver@^1';

export const BROWSER_PROJECT = 'tools/fresh-ui-browser';
export const STANDALONE_PROJECTS: readonly string[] = [BROWSER_PROJECT];
export type Operation = 'census' | 'latest' | 'outdated' | 'why' | 'audit' | 'prod-install';

export interface Inventory {
  project: string;
  manager: 'npm';
  developmentOnly: true;
  manifest: string;
  lock: string;
  scope: 'direct';
  dependencies: Array<{ name: string; declared: string; locked: string }>;
}

export interface ProcessResult {
  code: number;
  stdout: string;
  stderr: string;
}
export type Runner = (command: string, args: string[], cwd: string) => Promise<ProcessResult>;
export interface StableChannel {
  fetchLatestStable: (registry: 'npm' | 'jsr', name: string) => Promise<string>;
  basePinnedVersion: (range: string) => string;
}
export interface ProjectResult {
  exitCode: number;
  report: Record<string, unknown>;
}

class UsageError extends Error {}

/** Remove the selector before interpreting positional arguments such as a package name. */
export function projectSelection(argv: string[]): { project: string | null; args: string[] } {
  const args: string[] = [];
  let project: string | null = null;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--project' || arg.startsWith('--project=')) {
      if (project !== null) throw new UsageError('Pass --project only once');
      const value = arg === '--project' ? argv[++index] : arg.slice('--project='.length);
      if (!value || value.startsWith('--')) throw new UsageError('--project requires a directory');
      if (!STANDALONE_PROJECTS.some((path) => path === value)) {
        throw new UsageError(`Unknown standalone project: ${value}`);
      }
      project = value;
    } else args.push(arg);
  }
  return { project, args };
}

export interface Coverage {
  project: string;
  manager: string;
  included: boolean;
  inspectWith: string;
  reason?: string;
}

export function standaloneCoverage(operation: Operation): Coverage[] {
  return STANDALONE_PROJECTS.map((project) => ({
    project,
    manager: 'npm',
    included: operation === 'census',
    inspectWith: `deno task deps:${
      operation === 'prod-install' ? 'census' : operation
    } --project ${project}`,
    ...(operation === 'prod-install'
      ? { reason: 'Development-only tool; production install unsupported' }
      : {}),
  }));
}

export function coverageNotice(operation: Operation): string {
  return standaloneCoverage(operation).map((item) =>
    `Standalone ${item.project}: ${
      item.included ? 'inventoried separately' : 'excluded from workspace scan'
    }; ${item.reason ? `${item.reason}; ` : ''}${item.inspectWith}`
  ).join('\n');
}

/** Census reads the owning v3 lock without requiring npm or an installed node_modules tree. */
export async function projectInventory(
  root: string,
  project: string = BROWSER_PROJECT,
): Promise<Inventory> {
  if (!STANDALONE_PROJECTS.some((path) => path === project)) {
    throw new UsageError('Unknown project');
  }
  const manifest = `${project}/package.json`;
  const lock = `${project}/package-lock.json`;
  const pkg = JSON.parse(await Deno.readTextFile(`${root}/${manifest}`));
  const locked = JSON.parse(await Deno.readTextFile(`${root}/${lock}`));
  if (
    pkg.private !== true || Object.keys(pkg.dependencies ?? {}).length ||
    locked.lockfileVersion !== 3
  ) {
    throw new Error('Expected a private dev-only npm project with a v3 lock');
  }
  const declared: Record<string, string> = pkg.devDependencies ?? {};
  if (!Object.keys(declared).length) throw new Error('Standalone project has no devDependencies');
  const lockDeclarations = locked.packages?.['']?.devDependencies ?? {};
  if (Object.keys(lockDeclarations).length !== Object.keys(declared).length) {
    throw new Error('Manifest and lock declarations differ');
  }
  const dependencies = Object.entries(declared).sort(([a], [b]) => a.localeCompare(b)).map(
    ([name, version]) => {
      const resolved = locked.packages?.[`node_modules/${name}`]?.version;
      if (
        lockDeclarations[name] !== version || typeof resolved !== 'string' || resolved !== version
      ) {
        throw new Error(`Declared/locked version mismatch for ${name}: ${version} / ${resolved}`);
      }
      parse(resolved);
      return { name, declared: version, locked: resolved };
    },
  );
  return {
    project,
    manager: 'npm',
    developmentOnly: true,
    manifest,
    lock,
    scope: 'direct',
    dependencies,
  };
}

export const runProcess: Runner = async (command, args, cwd) => {
  const output = await new Deno.Command(command, { args, cwd, stdout: 'piped', stderr: 'piped' })
    .output();
  return {
    code: output.code,
    stdout: new TextDecoder().decode(output.stdout),
    stderr: new TextDecoder().decode(output.stderr),
  };
};

function jsonOutput(output: ProcessResult): Record<string, unknown> {
  const report = JSON.parse(output.stdout);
  if (
    !report || typeof report !== 'object' || Array.isArray(report) || report.error ||
    report.problems
  ) {
    throw new Error(`npm report failed: ${output.stderr || output.stdout}`);
  }
  return report;
}

function validateArgs(operation: Operation, args: string[]): void {
  const allowed = new Set(['--pretty', '--json']);
  if (operation === 'latest' || operation === 'outdated') {
    for (const option of ['--behind-only', '--fail-behind', '--latest']) allowed.add(option);
  }
  if (operation === 'audit') allowed.add('--fail-on-find');
  const positional: string[] = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (allowed.has(arg)) continue;
    if (
      (arg === '--level' && operation === 'audit') ||
      (arg === '--filter' && (operation === 'latest' || operation === 'outdated'))
    ) {
      if (!args[index + 1] || args[index + 1].startsWith('--')) {
        throw new UsageError(`${arg} requires a value`);
      }
      index++;
    } else if (arg.startsWith('-')) throw new UsageError(`Unsupported project option: ${arg}`);
    else positional.push(arg);
  }
  if (operation !== 'why' && positional.length) {
    throw new UsageError('Unexpected positional argument');
  }
}

/** All subprocess commands are read-only and include the development dependency graph. */
export function npmArgs(operation: 'why' | 'audit', args: string[]): string[] {
  if (operation === 'why') {
    const positional = args.filter((arg) => !arg.startsWith('--'));
    if (
      positional.length !== 1 ||
      !/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/i.test(positional[0])
    ) throw new UsageError('why requires exactly one package name');
    return ['ls', positional[0], '--all', '--package-lock-only', '--json'];
  }
  const index = args.indexOf('--level');
  const level = index < 0 ? 'low' : args[index + 1];
  if (!['low', 'moderate', 'high', 'critical'].includes(level)) {
    throw new UsageError('Invalid audit level');
  }
  return [
    'audit',
    '--package-lock-only',
    '--include=dev',
    '--ignore-scripts',
    '--json',
    `--audit-level=${level}`,
  ];
}

/** Inject native processes and stable lookups so root tests never need npm or network access. */
export async function selectedProjectReport(
  operation: Operation,
  argv: string[],
  options: { root?: string; runner?: Runner; stable?: StableChannel } = {},
): Promise<ProjectResult | null> {
  try {
    const { project, args } = projectSelection(argv);
    if (!project) return null;
    if (operation === 'prod-install') {
      throw new UsageError(
        'Production install unsupported for a dev-only npm tool; use deps:census --project',
      );
    }
    validateArgs(operation, args);
    // Validate usage before any process can execute.
    const command = operation === 'why' || operation === 'audit'
      ? npmArgs(operation, args)
      : undefined;
    const root = options.root ?? Deno.cwd();
    const inventory = await projectInventory(root, project);
    if (operation === 'census') return { exitCode: 0, report: { ...inventory } };
    if (operation === 'latest' || operation === 'outdated') {
      const stable = options.stable;
      if (!stable) throw new Error('Stable-channel resolver unavailable');
      const filterIndex = args.indexOf('--filter');
      const filterValue = filterIndex < 0 ? undefined : args[filterIndex + 1];
      const filter = filterValue
        ? new RegExp(`^${filterValue.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*')}$`)
        : null;
      const entries = await Promise.all(
        inventory.dependencies.filter((dependency) => !filter || filter.test(dependency.name)).map(
          async (dependency) => {
            const latestStable = await stable.fetchLatestStable('npm', dependency.name);
            const latest = parse(latestStable);
            if (latest.prerelease?.length) {
              throw new Error(`Stable channel returned prerelease for ${dependency.name}`);
            }
            return {
              ...dependency,
              latestStable,
              behind: greaterThan(latest, parse(stable.basePinnedVersion(dependency.locked))),
            };
          },
        ),
      );
      const filtered = entries;
      const behind = filtered.filter((entry) => entry.behind).length;
      return {
        exitCode: args.includes('--fail-behind') && behind ? 1 : 0,
        report: {
          ...inventory,
          mode: 'locked-stable',
          scope: 'direct',
          entries: args.includes('--behind-only')
            ? filtered.filter((entry) => entry.behind)
            : filtered,
          behind,
        },
      };
    }
    const output = await (options.runner ?? runProcess)('npm', command!, `${root}/${project}`);
    const native = jsonOutput(output);
    if (operation === 'why') {
      const present = Object.keys((native.dependencies ?? {}) as object).length > 0;
      if (output.code !== 0 && !(output.code === 1 && !present)) throw new Error('npm ls failed');
      return {
        exitCode: 0,
        report: {
          ...inventory,
          inventoryScope: inventory.scope,
          scope: 'resolved-graph',
          package: command![1],
          transitivelyPresent: present,
          sourceUsage: 'unsupported: CLI usage is not inferred from source imports',
          fullyRemovable: false,
          native,
        },
      };
    }
    const metadata = native.metadata as {
      dependencies?: { total?: number; dev?: number };
      vulnerabilities?: { total?: number };
    } | undefined;
    const total = metadata?.vulnerabilities?.total;
    const covered = metadata?.dependencies?.total;
    if (
      native.auditReportVersion !== 2 || typeof total !== 'number' || typeof covered !== 'number' ||
      covered < inventory.dependencies.length || !metadata?.dependencies?.dev || output.code > 1 ||
      (output.code === 1 && total === 0)
    ) {
      throw new Error('npm audit failed or did not cover the development graph');
    }
    return {
      exitCode: args.includes('--fail-on-find') && output.code === 1 ? 1 : 0,
      report: {
        ...inventory,
        inventoryScope: inventory.scope,
        scope: 'resolved-graph',
        advisoriesFound: output.code === 1,
        totalAdvisories: total,
        coveredPackages: covered,
        nativeExitCode: output.code,
        native,
      },
    };
  } catch (error) {
    return {
      exitCode: error instanceof UsageError ? 2 : 3,
      report: {
        operation,
        clean: false,
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export function printProjectReport(result: ProjectResult, pretty: boolean): void {
  if (pretty) console.log(`Standalone dependency report (exit ${result.exitCode})`);
  console.log(JSON.stringify(result.report, null, 2));
}

export async function runSelectedProject(
  operation: Operation,
  stable?: StableChannel,
): Promise<boolean> {
  const result = await selectedProjectReport(operation, Deno.args, { stable });
  if (!result) return false;
  printProjectReport(result, Deno.args.includes('--pretty'));
  Deno.exit(result.exitCode);
}
