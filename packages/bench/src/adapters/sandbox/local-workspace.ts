/**
 * Local workspace sandbox: provisions a throwaway working directory in the OS
 * temp area (never `.llm/tmp`, which is in-tree) and seeds it with the task's
 * agent-visible files.
 *
 * Isolation rules (OQ4):
 *   - The workdir lives under `Deno.makeTempDir`, outside the repo checkout, so
 *     an agent cannot reach the framework source or the frozen suites.
 *   - The frozen `tests/` and `reference/` directories are NEVER copied in —
 *     the agent must not see the black-box suite or any golden solution.
 *   - Agent subprocesses launched against this workdir must run under restricted
 *     Deno permissions scoped to the workdir (enforced by the command executor).
 *
 * @module
 */

import { copy, ensureDir } from '@std/fs';
import { basename, join } from '@std/path';
import type { Sandbox, SandboxProvider, SandboxRequest } from '../../ports/sandbox.ts';

/** Directory names that must never be copied into an agent sandbox. */
const EXCLUDED_SEED_DIRS: readonly string[] = ['tests', 'reference'];

/** Options for {@link LocalWorkspaceSandbox}. */
export interface LocalWorkspaceOptions {
  /** Temp-dir name prefix. Defaults to `netscript-bench-`. */
  readonly prefix?: string;
  /**
   * Seed the sandbox with the task's agent-visible files (prompt, context,
   * rubric). Defaults to true. The excluded dirs above are always skipped.
   */
  readonly seedTaskFiles?: boolean;
}

/** {@link SandboxProvider} backed by an OS temp directory. */
export class LocalWorkspaceSandbox implements SandboxProvider {
  readonly #prefix: string;
  readonly #seed: boolean;

  constructor(options: LocalWorkspaceOptions = {}) {
    this.#prefix = options.prefix ?? 'netscript-bench-';
    this.#seed = options.seedTaskFiles ?? true;
  }

  async create(request: SandboxRequest): Promise<Sandbox> {
    const workdir = await Deno.makeTempDir({ prefix: this.#prefix });
    if (this.#seed) {
      await this.#seedFrom(request.taskDir, workdir);
    }
    return { workdir, taskId: request.taskId };
  }

  async #seedFrom(taskDir: string, workdir: string): Promise<void> {
    let entries: Deno.DirEntry[];
    try {
      entries = await Array.fromAsync(Deno.readDir(taskDir));
    } catch {
      // Task dir may not exist in some unit contexts; a bare workdir is valid.
      return;
    }
    await ensureDir(workdir);
    for (const entry of entries) {
      if (entry.isDirectory && EXCLUDED_SEED_DIRS.includes(entry.name)) continue;
      const from = join(taskDir, entry.name);
      const to = join(workdir, basename(from));
      await copy(from, to, { overwrite: true });
    }
  }

  async dispose(sandbox: Sandbox): Promise<void> {
    try {
      await Deno.remove(sandbox.workdir, { recursive: true });
    } catch {
      // Best-effort cleanup; a missing dir is already disposed.
    }
  }
}
