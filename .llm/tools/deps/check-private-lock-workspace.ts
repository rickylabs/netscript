/** Guard member-private lockfiles against drifting from the root lock's workspace section. */
import { join } from '@std/path';
import {
  discoverWorkspaceMembers,
  exists,
  type Finding,
  hasFail,
  printFindings,
  readJsonFile,
} from './workspace.ts';

/** A lockfile's workspace section: root config/package.json deps plus per-member entries. */
type LockWorkspace = Readonly<Record<string, unknown>> & {
  readonly members?: Readonly<Record<string, unknown>>;
};

/** One member-private lock (e.g. `packages/fresh-ui/deno.lock`, used with `--lock --frozen`). */
export interface PrivateLock {
  readonly path: string;
  readonly workspace: unknown;
}

function section(value: unknown): LockWorkspace | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as LockWorkspace
    : undefined;
}

function differingKeys(
  expected: Readonly<Record<string, unknown>>,
  actual: Readonly<Record<string, unknown>>,
): string[] {
  return [...new Set([...Object.keys(expected), ...Object.keys(actual)])]
    .filter((key) => JSON.stringify(expected[key]) !== JSON.stringify(actual[key]))
    .sort();
}

/**
 * A private lock records the same workspace graph as the root lock. When a member's
 * package.json/deno.json dependency set changes, both must be refreshed or the private
 * `--frozen` check fails with "The lockfile is out of date".
 */
export function analyzePrivateLockWorkspaces(
  rootWorkspace: unknown,
  privateLocks: readonly PrivateLock[],
): Finding[] {
  const expected = section(rootWorkspace);
  if (!expected) {
    return [{
      ref: 'DEPS-PRIVATE-LOCK',
      level: 'FAIL',
      message: 'root deno.lock has no workspace',
    }];
  }
  const findings: Finding[] = [];
  for (const lock of privateLocks) {
    const actual = section(lock.workspace);
    if (!actual) {
      findings.push({
        ref: 'DEPS-PRIVATE-LOCK',
        level: 'FAIL',
        message: 'private lock has no workspace section',
        path: lock.path,
      });
      continue;
    }
    const { members: expectedMembers = {}, ...expectedRoot } = expected;
    const { members: actualMembers = {}, ...actualRoot } = actual;
    const drift = [
      ...differingKeys(expectedRoot, actualRoot).map((key) => `workspace.${key}`),
      ...differingKeys(expectedMembers, actualMembers).map((key) => `members.${key}`),
    ];
    if (drift.length) {
      findings.push({
        ref: 'DEPS-PRIVATE-LOCK',
        level: 'FAIL',
        message: `workspace drifts from root deno.lock at ${
          drift.join(', ')
        }; run the member's lock:update task`,
        path: lock.path,
      });
    }
  }
  return findings;
}

/** Root workspace section plus every member directory that carries its own deno.lock. */
export async function readLockWorkspaces(
  root: string,
): Promise<{ rootWorkspace: unknown; privateLocks: PrivateLock[] }> {
  const rootWorkspace = (await readJsonFile(join(root, 'deno.lock'))).workspace;
  const privateLocks: PrivateLock[] = [];
  for (const member of await discoverWorkspaceMembers(root)) {
    const path = join(member.root, 'deno.lock');
    if (!(await exists(join(root, path)))) continue;
    privateLocks.push({ path, workspace: (await readJsonFile(join(root, path))).workspace });
  }
  return { rootWorkspace, privateLocks };
}

if (import.meta.main) {
  const { rootWorkspace, privateLocks } = await readLockWorkspaces(Deno.cwd());
  const findings = analyzePrivateLockWorkspaces(rootWorkspace, privateLocks);
  printFindings(findings, Deno.args.includes('--json'));
  if (hasFail(findings)) Deno.exit(1);
  console.log(`private-lock-workspace PASS locks=${privateLocks.length}`);
}
