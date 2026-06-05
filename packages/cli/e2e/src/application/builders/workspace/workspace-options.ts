import { join, resolve } from '@std/path';
import type { RunOptions } from '../../../domain/run-context.ts';

/** Resolve the default local contributor CLI binary from the repo root. */
export function defaultCliEntrypoint(repoRoot: string): string {
  return join(repoRoot, 'packages', 'cli', 'bin', 'netscript-dev.ts');
}

/** Apply a repository root to run options and derive dependent paths. */
export function withRepoRootOption(options: RunOptions, repoRoot: string): RunOptions {
  const root = resolve(repoRoot);
  return {
    ...options,
    repoRoot: root,
    cliEntrypoint: defaultCliEntrypoint(root),
    smokeRoot: join(root, '.llm', 'tmp', 'cli-e2e'),
  };
}
