#!/usr/bin/env -S deno run --allow-read
import { join, normalize } from '@std/path';
import { discoverWorkspaceMembers, readJsonFile } from '../deps/workspace.ts';
import { discoverDoctrineRoots } from '../fitness/check-doctrine.ts';

const COVERAGE_TASKS = ['quality:scan', 'quality:scan:repo'] as const;
const INCLUDED_PARENTS = ['packages/**', 'plugins/**'] as const;

export interface RootCoverageMember {
  name: string;
  root: string;
  publishable: boolean;
}

export interface RootCoverageInput {
  workspaceMembers: readonly RootCoverageMember[];
  doctrineRoots: readonly string[];
  taskCommands: Readonly<Record<string, string>>;
}

export interface NamedExclusion {
  path: string;
  reason: string;
}

export interface QualityTaskCoverage {
  task: string;
  configuredRoots: string[];
  uncoveredPublishedMembers: string[];
}

export interface RootCoverageReport {
  ok: boolean;
  census: {
    workspaceMembers: number;
    membersInsideBoundary: number;
    publishableMembersInsideBoundary: number;
  };
  boundary: {
    includedParents: readonly string[];
    description: string;
    excludedWorkspaceMembers: {
      count: number;
      paths: string[];
      reason: string;
    };
  };
  publishableMembers: string[];
  excludedNonPublishableMembers: NamedExclusion[];
  qualityTasks: QualityTaskCoverage[];
  doctrine: {
    configuredRoots: string[];
    uncoveredPublishedMembers: string[];
  };
  scannerTraversal: {
    observedByChecker: false;
    traversedPaths: null;
    note: string;
  };
  errors: string[];
}

interface DenoTaskObject {
  command?: unknown;
}

function repoPath(path: string): string {
  const normalized = normalize(path).replaceAll('\\', '/').replace(/^\.\//, '');
  return normalized === '' ? '.' : normalized.replace(/\/$/, '');
}

function sortedUnique(paths: readonly string[]): string[] {
  return [...new Set(paths.map(repoPath))].sort((left, right) => left.localeCompare(right));
}

function isInsideBoundary(path: string): boolean {
  const normalized = repoPath(path);
  return normalized.startsWith('packages/') || normalized.startsWith('plugins/');
}

function configuredRoots(command: string): string[] {
  const roots: string[] = [];
  const expression = /(?:^|\s)--root(?:\s+|=)(?:"([^"]+)"|'([^']+)'|([^\s;&|]+))/g;
  for (const match of command.matchAll(expression)) {
    const root = match[1] ?? match[2] ?? match[3];
    if (root) roots.push(root);
  }
  return sortedUnique(roots);
}

function rootCoversMember(root: string, memberRoot: string): boolean {
  const configured = repoPath(root);
  const member = repoPath(memberRoot);
  return configured === '.' || configured === member || member.startsWith(`${configured}/`);
}

function uncoveredMembers(members: readonly string[], roots: readonly string[]): string[] {
  return members.filter((memberRoot) => !roots.some((root) => rootCoversMember(root, memberRoot)));
}

/** Evaluates configured root coverage without claiming which paths a scanner invocation traversed. */
export function evaluateRootCoverage(input: RootCoverageInput): RootCoverageReport {
  const workspaceMembers = [...input.workspaceMembers].sort((left, right) =>
    repoPath(left.root).localeCompare(repoPath(right.root))
  );
  const insideBoundary = workspaceMembers.filter((workspaceMember) =>
    isInsideBoundary(workspaceMember.root)
  );
  const outsideBoundary = workspaceMembers.filter((workspaceMember) =>
    !isInsideBoundary(workspaceMember.root)
  );
  const publishableMembers = sortedUnique(
    insideBoundary.filter((workspaceMember) => workspaceMember.publishable).map((member) =>
      member.root
    ),
  );
  const excludedNonPublishableMembers = insideBoundary
    .filter((workspaceMember) => !workspaceMember.publishable)
    .map((workspaceMember) => ({
      path: repoPath(workspaceMember.root),
      reason: 'publish:false',
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const errors: string[] = [];

  if (publishableMembers.length === 0) {
    errors.push('publishable packages/** and plugins/** denominator is empty');
  }

  const qualityTasks = COVERAGE_TASKS.map((task): QualityTaskCoverage => {
    const command = input.taskCommands[task]?.trim() ?? '';
    const roots = command ? configuredRoots(command) : [];
    const uncovered = uncoveredMembers(publishableMembers, roots);
    if (!command) errors.push(`${task} is missing or has no command`);
    else if (roots.length === 0) errors.push(`${task} has no configured roots`);
    if (uncovered.length > 0) {
      errors.push(`${task} does not cover: ${uncovered.join(', ')}`);
    }
    return {
      task,
      configuredRoots: roots,
      uncoveredPublishedMembers: uncovered,
    };
  });

  const doctrineRoots = sortedUnique(input.doctrineRoots);
  const uncoveredDoctrineMembers = uncoveredMembers(publishableMembers, doctrineRoots);
  if (uncoveredDoctrineMembers.length > 0) {
    errors.push(`arch:check does not cover: ${uncoveredDoctrineMembers.join(', ')}`);
  }

  const outsidePaths = sortedUnique(outsideBoundary.map((member) => member.root));
  return {
    ok: errors.length === 0,
    census: {
      workspaceMembers: workspaceMembers.length,
      membersInsideBoundary: insideBoundary.length,
      publishableMembersInsideBoundary: publishableMembers.length,
    },
    boundary: {
      includedParents: INCLUDED_PARENTS,
      description:
        'The #1542 denominator is limited to workspace members under packages/** and plugins/**.',
      excludedWorkspaceMembers: {
        count: outsidePaths.length,
        paths: outsidePaths,
        reason: 'outside packages/** and plugins/**',
      },
    },
    publishableMembers,
    excludedNonPublishableMembers,
    qualityTasks,
    doctrine: {
      configuredRoots: doctrineRoots,
      uncoveredPublishedMembers: uncoveredDoctrineMembers,
    },
    scannerTraversal: {
      observedByChecker: false,
      traversedPaths: null,
      note:
        'configuredRoots are configuration coverage only; scanner mode and traversed paths belong to the scanner run report',
    },
    errors,
  };
}

function taskCommand(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const command = (value as DenoTaskObject).command;
    return typeof command === 'string' ? command : '';
  }
  return '';
}

/** Reads repository configuration and returns a deterministic, fail-closed coverage report. */
export async function checkRootCoverage(
  repoRoot: string = Deno.cwd(),
): Promise<RootCoverageReport> {
  const config = await readJsonFile(join(repoRoot, 'deno.json'));
  const tasks = config.tasks && typeof config.tasks === 'object' && !Array.isArray(config.tasks)
    ? config.tasks as Record<string, unknown>
    : {};
  const taskCommands = Object.fromEntries(
    COVERAGE_TASKS.map((task) => [task, taskCommand(tasks[task])]),
  );
  const members = await discoverWorkspaceMembers(repoRoot);
  return evaluateRootCoverage({
    workspaceMembers: members,
    doctrineRoots: await discoverDoctrineRoots(repoRoot),
    taskCommands,
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function main(): Promise<number> {
  try {
    const report = await checkRootCoverage();
    console.log(JSON.stringify(report));
    return report.ok ? 0 : 1;
  } catch (error) {
    console.log(JSON.stringify({
      ok: false,
      error: {
        kind: 'root-coverage-check-failed',
        message: errorMessage(error),
      },
    }));
    return 1;
  }
}

if (import.meta.main) Deno.exit(await main());
