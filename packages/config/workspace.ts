/**
 * @module @netscript/config/workspace
 *
 * Deno workspace discovery helpers used by the CLI and generators.
 */

import { expandGlob } from '@std/fs';
import { join, relative, resolve } from '@std/path';

/** Workspace member category inferred from its relative path. */
export type WorkspaceMemberType = 'service' | 'plugin' | 'background' | 'package' | 'app' | 'other';

/** Deno workspace member discovered from a member `deno.json`. */
export interface WorkspaceMember {
  /** Package name declared by the member. */
  name: string;
  /** Workspace-relative member path. */
  path: string;
  /** Export map declared by the member. */
  exports?: Record<string, string> | string;
  /** Inferred workspace member category. */
  type: WorkspaceMemberType;
}

/** Classified snapshot of a Deno workspace. */
export interface WorkspaceMap {
  /** Absolute workspace root path. */
  root: string;
  /** All discovered members sorted by path. */
  members: WorkspaceMember[];
  /** Members classified as services. */
  services: WorkspaceMember[];
  /** Members classified as plugins. */
  plugins: WorkspaceMember[];
  /** Members classified as background processors. */
  backgroundProcessors: WorkspaceMember[];
  /** Members classified as framework packages. */
  packages: WorkspaceMember[];
  /** Members classified as frontend apps. */
  apps: WorkspaceMember[];
}

interface DenoJsonFile {
  workspace?: string[];
  name?: string;
  exports?: Record<string, string> | string;
}

function normalizeRelativePath(path: string): string {
  return path.replace(/\\/g, '/');
}

function classifyMember(path: string): WorkspaceMemberType {
  const normalized = normalizeRelativePath(path);
  if (normalized.startsWith('services/')) return 'service';
  if (normalized.startsWith('plugins/') && normalized !== 'plugins') return 'plugin';
  if (normalized.startsWith('packages/')) return 'package';
  if (normalized.startsWith('apps/')) return 'app';
  if (['workers', 'sagas', 'triggers'].includes(normalized)) return 'background';
  return 'other';
}

async function readJsonFile<T>(path: string): Promise<T | null> {
  try {
    const content = await Deno.readTextFile(path);
    return JSON.parse(content) as T;
  } catch (error: unknown) {
    if (error instanceof Deno.errors.NotFound) {
      return null;
    }
    throw error;
  }
}

/**
 * Find the nearest Deno workspace root from a starting directory.
 *
 * @param startDir - Directory to start searching from.
 * @returns Absolute path to the workspace root.
 */
export async function findWorkspaceRoot(startDir: string = Deno.cwd()): Promise<string> {
  let currentDir = resolve(startDir);

  for (;;) {
    const denoJson = await readJsonFile<DenoJsonFile>(join(currentDir, 'deno.json'));
    if (Array.isArray(denoJson?.workspace)) {
      return currentDir;
    }

    const parentDir = resolve(currentDir, '..');
    if (parentDir === currentDir) {
      throw new Error(`Could not find a Deno workspace root starting from ${startDir}`);
    }

    currentDir = parentDir;
  }
}

/**
 * Discover and classify Deno workspace members.
 *
 * @param rootDir - Optional workspace root path. When omitted, the root is discovered.
 * @returns Classified workspace member map.
 */
export async function discoverWorkspace(rootDir?: string): Promise<WorkspaceMap> {
  const root = rootDir ? resolve(rootDir) : await findWorkspaceRoot();
  const rootConfig = await readJsonFile<DenoJsonFile>(join(root, 'deno.json'));

  if (!Array.isArray(rootConfig?.workspace)) {
    throw new Error(`Workspace root ${root} does not declare a workspace array in deno.json`);
  }

  const membersByPath = new Map<string, WorkspaceMember>();

  for (const pattern of rootConfig.workspace) {
    for await (
      const entry of expandGlob(pattern, {
        root,
        includeDirs: true,
        globstar: true,
      })
    ) {
      if (!entry.isDirectory) {
        continue;
      }

      const memberConfig = await readJsonFile<DenoJsonFile>(join(entry.path, 'deno.json'));
      if (!memberConfig?.name) {
        continue;
      }

      const memberPath = normalizeRelativePath(relative(root, entry.path));
      membersByPath.set(memberPath, {
        name: memberConfig.name,
        path: memberPath,
        exports: memberConfig.exports,
        type: classifyMember(memberPath),
      });
    }
  }

  const members = Array.from(membersByPath.values())
    .sort((a, b) => a.path.localeCompare(b.path));

  return {
    root,
    members,
    services: members.filter((member) => member.type === 'service'),
    plugins: members.filter((member) => member.type === 'plugin'),
    backgroundProcessors: members.filter((member) => member.type === 'background'),
    packages: members.filter((member) => member.type === 'package'),
    apps: members.filter((member) => member.type === 'app'),
  };
}

/**
 * Find a workspace member by package name or relative path.
 *
 * @param workspace - Workspace map returned by {@linkcode discoverWorkspace}.
 * @param memberName - Package name or relative path to find.
 * @returns Matching workspace member, or undefined when absent.
 */
export function findMember(
  workspace: WorkspaceMap,
  memberName: string,
): WorkspaceMember | undefined {
  return workspace.members.find((member) =>
    member.name === memberName || member.path === memberName
  );
}

/**
 * Resolve the default entrypoint for a workspace member.
 *
 * @param member - Workspace member to inspect.
 * @returns Default export entrypoint, falling back to `./mod.ts`.
 */
export function getMemberEntrypoint(member: WorkspaceMember): string {
  if (typeof member.exports === 'string') {
    return member.exports;
  }

  return member.exports?.['.'] ?? './mod.ts';
}
