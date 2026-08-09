import { isAbsolute, join, relative, resolve } from '@std/path';

import { ScaffoldValidationError } from '../../domain/errors.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';

/** User-selected inputs that can identify a Fresh application root. */
export interface UiAppRootInput {
  /** Explicit application directory. */
  readonly projectRoot?: string;
  /** Workspace application name below `apps/`. */
  readonly app?: string;
}

/** Host dependencies used to resolve UI commands to one application. */
export interface UiAppRootDependencies {
  readonly fs: FileSystemPort;
  readonly cwd: () => string;
  readonly resolvePath: (path: string) => string;
  readonly resolveWorkspaceRoot: (startDir: string) => Promise<string | null>;
}

interface UiAppCandidate {
  readonly name: string;
  readonly path: string;
}

/** Resolve a UI command target without silently choosing between Fresh applications. */
export async function resolveUiAppRoot(
  input: UiAppRootInput,
  dependencies: UiAppRootDependencies,
): Promise<string | undefined> {
  if (input.projectRoot) return dependencies.resolvePath(input.projectRoot);

  const cwd = resolve(dependencies.cwd());
  const workspaceRoot = await dependencies.resolveWorkspaceRoot(cwd);
  if (!workspaceRoot) return undefined;

  const candidates = await listUiAppCandidates(workspaceRoot, dependencies.fs);
  if (input.app) {
    const selected = candidates.find((candidate) => candidate.name === input.app);
    if (selected) return selected.path;
    throw new ScaffoldValidationError(
      `Fresh app "${input.app}" was not found. Available apps: ${candidateNames(candidates)}.`,
      { app: input.app, candidates: candidates.map((candidate) => candidate.name) },
    );
  }

  const current = candidates.find((candidate) => contains(candidate.path, cwd));
  if (current) return current.path;
  if (candidates.length === 1) return candidates[0].path;

  if (candidates.length === 0) {
    throw new ScaffoldValidationError(
      `No Fresh apps were found under ${join(workspaceRoot, 'apps')}.`,
      { workspaceRoot },
    );
  }
  throw new ScaffoldValidationError(
    `Multiple Fresh apps were found: ${candidateNames(candidates)}. Select one with --app <name>.`,
    { candidates: candidates.map((candidate) => candidate.name) },
  );
}

async function listUiAppCandidates(
  workspaceRoot: string,
  fs: FileSystemPort,
): Promise<readonly UiAppCandidate[]> {
  const config = JSON.parse(await fs.readFile(join(workspaceRoot, 'deno.json'))) as {
    readonly workspace?: unknown;
  };
  const members = Array.isArray(config.workspace) ? config.workspace : [];
  const candidates: UiAppCandidate[] = [];
  for (const member of members) {
    if (typeof member !== 'string') continue;
    const normalized = member.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '');
    const match = /^apps\/([^/*]+)$/.exec(normalized);
    if (!match) continue;
    const path = resolve(workspaceRoot, normalized);
    if ((await fs.exists(path)) && (await fs.stat(path)).isDirectory) {
      candidates.push({ name: match[1], path });
    }
  }
  return candidates.sort((left, right) => left.name.localeCompare(right.name));
}

function contains(parent: string, child: string): boolean {
  const path = relative(parent, child);
  return path === '' ||
    (!isAbsolute(path) && path !== '..' && !path.startsWith('../') && !path.startsWith('..\\'));
}

function candidateNames(candidates: readonly UiAppCandidate[]): string {
  return candidates.length > 0
    ? candidates.map((candidate) => candidate.name).join(', ')
    : '(none)';
}
