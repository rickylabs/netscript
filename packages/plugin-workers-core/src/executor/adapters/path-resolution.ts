import { resolve } from '@std/path';
import type { EnvironmentReader } from './command-spec.ts';

/** Resolve a task entrypoint using the current runtime deployment rules. */
export function resolveTaskEntrypoint(
  entrypoint: string,
  cwd: string | undefined,
  env: EnvironmentReader,
): string {
  if (entrypoint.startsWith('/') || /^[A-Za-z]:/.test(entrypoint)) {
    return entrypoint;
  }

  const tasksDir = env('NETSCRIPT_TASKS_DIR');
  if (tasksDir && entrypoint.startsWith('./')) {
    let filename = entrypoint.slice(2);
    if (filename.startsWith('tasks/')) {
      filename = filename.slice(6);
    }
    return resolve(tasksDir, filename);
  }

  return cwd ? resolve(cwd, entrypoint) : entrypoint;
}

/** Resolve Git Bash utility paths that should be added to PATH on Windows. */
export function resolveGitBashUtilPaths(
  shellPath: string,
  os: typeof Deno.build.os,
): readonly string[] {
  if (os !== 'windows') return [];
  const normalized = shellPath.replace(/\//g, '\\');
  const gitRootMatch = normalized.match(/^(.+?\\Git)\\(?:usr\\bin|bin)\\bash\.exe$/i);
  if (!gitRootMatch) return [];
  const gitRoot = gitRootMatch[1];
  return [`${gitRoot}\\usr\\bin`, `${gitRoot}\\bin`, `${gitRoot}\\mingw64\\bin`];
}
