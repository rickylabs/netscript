/**
 * SandboxProvider port: creates and disposes throwaway working directories for
 * agent runs, isolated from the repo checkout.
 *
 * @module
 */

/** A live sandbox handle. Disposed via {@link SandboxProvider.dispose}. */
export interface Sandbox {
  /** Absolute path to the throwaway working directory. */
  readonly workdir: string;
  /** Task the sandbox was provisioned for. */
  readonly taskId: string;
}

/** Options for provisioning a sandbox. */
export interface SandboxRequest {
  readonly taskId: string;
  /**
   * Absolute path to the task directory whose seed files (context, starter
   * scaffolding) should be copied in. The frozen `tests/` directory is never
   * copied into the sandbox — the agent must not see it.
   */
  readonly taskDir: string;
}

/**
 * Provisions isolated sandboxes. The local implementation uses an OS temp
 * directory (never `.llm/tmp`, which is in-tree) and runs agent processes under
 * restricted Deno permissions (OQ4).
 */
export interface SandboxProvider {
  create(request: SandboxRequest): Promise<Sandbox>;
  dispose(sandbox: Sandbox): Promise<void>;
}
