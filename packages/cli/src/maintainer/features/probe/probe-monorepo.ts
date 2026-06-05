/** Request for discovering maintainer monorepo capabilities. */
export interface ProbeMonorepoRequest {
  /** Directory where monorepo discovery should begin. */
  readonly startDir: string;
  /** Optional workspace target used to compute a local import base. */
  readonly targetPath?: string;
}

/** Result of probing the current checkout for maintainer-only capabilities. */
export interface ProbeMonorepoResult {
  /** Directory where discovery began. */
  readonly startDir: string;
  /** Detected monorepo root, when available. */
  readonly sourceRoot?: string;
  /** Relative import-map base from the target workspace back to the monorepo root. */
  readonly localBase?: string;
  /** Whether local package sync can run. */
  readonly canSyncPackages: boolean;
  /** Whether local plugin sync can run. */
  readonly canSyncPlugins: boolean;
  /** Whether the local import resolver is available. */
  readonly canResolveLocalImports: boolean;
}

/** Dependencies used by the maintainer monorepo probe flow. */
export interface ProbeMonorepoDependencies {
  /** Detect a NetScript monorepo root from a starting directory. */
  readonly detectMonorepoRoot: (startDir: string) => Promise<string | undefined>;
  /** Optionally discover the official plugin source checkout. */
  readonly findOfficialPluginSourceRoot?: (startDir?: string) => Promise<string | null>;
  /** Compute a relative local import base between two absolute paths. */
  readonly computeLocalBase: (from: string, to: string) => string;
  /** Whether the local import resolver is available in this graph. */
  readonly hasLocalImportResolver?: boolean;
}

/** Discover the current monorepo root and maintainer-only capabilities. */
export async function probeMonorepo(
  request: ProbeMonorepoRequest,
  dependencies: ProbeMonorepoDependencies,
): Promise<ProbeMonorepoResult> {
  const sourceRoot = await dependencies.detectMonorepoRoot(request.startDir);
  const pluginSourceRoot = dependencies.findOfficialPluginSourceRoot
    ? await dependencies.findOfficialPluginSourceRoot(request.startDir)
    : null;

  return {
    startDir: request.startDir,
    sourceRoot,
    localBase: sourceRoot && request.targetPath
      ? dependencies.computeLocalBase(request.targetPath, sourceRoot)
      : undefined,
    canSyncPackages: sourceRoot !== undefined,
    canSyncPlugins: pluginSourceRoot !== null,
    canResolveLocalImports: dependencies.hasLocalImportResolver ?? true,
  };
}
