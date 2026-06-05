import { basename, dirname, join, relative } from '@std/path';

import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ProcessPort } from '../../../../kernel/ports/process-port.ts';
import type { MaintainerInitDependencies } from '../../init/orchestrate-maintainer-init.ts';
import { orchestrateMaintainerInit } from '../../init/orchestrate-maintainer-init.ts';
import type {
  SyncPackagesDependencies,
  SyncPackagesRequest,
} from '../../sync/packages/sync-packages.ts';
import { syncPackages } from '../../sync/packages/sync-packages.ts';
import type { SyncPluginDependencies } from '../../sync/plugin/sync-plugin.ts';
import { syncPlugin } from '../../sync/plugin/sync-plugin.ts';
import type { SyncTemplatesDependencies } from '../../sync/templates/sync-templates.ts';
import { syncTemplates } from '../../sync/templates/sync-templates.ts';
import { DEFAULT_BRANCH, DEFAULT_REMOTE } from './release-eject-constants.ts';
import { initializeGitRepository } from './release-eject-git.ts';
import {
  markExamplesNonPublishable,
  removeScaffoldOnlyRoots,
  resetMemberVersions,
  writeProducerRootFiles,
} from './producer-root-files.ts';

interface PluginManifest {
  readonly provider?: {
    readonly kind?: string;
  };
}

/** Request for the maintainer release eject flow. */
export interface ReleaseEjectRequest {
  /** Absolute target path for the generated producer repository. */
  readonly targetPath: string;
  /** Optional explicit source monorepo root. */
  readonly sourceRoot?: string;
  /** Whether an existing target tree can be removed first. */
  readonly force?: boolean;
  /** Skip clean-room git initialization and genesis commit. */
  readonly noGit?: boolean;
  /** Skip gitleaks secret scanning. */
  readonly noGitleaks?: boolean;
  /** Push the genesis branch to the remote after commit. */
  readonly push?: boolean;
  /** Remote URL for the generated repository. */
  readonly remote?: string;
  /** Branch name to create in the generated repository. */
  readonly branch?: string;
}

/** One official plugin synced during release eject. */
export interface ReleaseEjectPluginResult {
  /** Plugin kind from the source manifest. */
  readonly kind: string;
  /** Canonical plugin directory copied. */
  readonly name: string;
}

/** Result returned by the maintainer release eject flow. */
export interface ReleaseEjectResult {
  /** Source monorepo root used for the eject. */
  readonly sourceRoot: string;
  /** Generated producer repository root. */
  readonly targetPath: string;
  /** Package count copied into the producer tree. */
  readonly packagesCopied: number;
  /** Official plugins synced into the producer tree. */
  readonly pluginsSynced: readonly ReleaseEjectPluginResult[];
  /** Root and member metadata files written. */
  readonly filesWritten: readonly string[];
  /** Genesis commit hash when git initialization ran. */
  readonly gitCommit: string | null;
}

/** Dependencies used by the maintainer release eject flow. */
export interface ReleaseEjectDependencies {
  /** Current working directory provider. */
  readonly cwd: () => string;
  /** Filesystem adapter. */
  readonly fs: FileSystemPort;
  /** External process adapter. */
  readonly process: ProcessPort;
  /** Detect the NetScript source monorepo root. */
  readonly detectMonorepoRoot: (startDir: string) => Promise<string | undefined>;
  /** Dependencies for maintainer init. */
  readonly initDependencies: MaintainerInitDependencies;
  /** Dependencies for package sync. */
  readonly syncPackagesDependencies: SyncPackagesDependencies;
  /** Dependencies for plugin sync. */
  readonly syncPluginDependencies: SyncPluginDependencies;
  /** Dependencies for template sync. */
  readonly syncTemplatesDependencies: SyncTemplatesDependencies;
}

/** Eject the NetScript producer repository into a clean target directory. */
export async function releaseEject(
  request: ReleaseEjectRequest,
  dependencies: ReleaseEjectDependencies,
): Promise<ReleaseEjectResult> {
  const sourceRoot = request.sourceRoot ??
    await dependencies.detectMonorepoRoot(dependencies.cwd());
  if (!sourceRoot) {
    throw new Error('release eject requires a NetScript monorepo checkout.');
  }

  assertTargetInsideSourceRoot(request.targetPath, sourceRoot);
  if (request.force && await dependencies.fs.exists(request.targetPath)) {
    await dependencies.fs.remove(request.targetPath);
  }

  const targetName = basename(request.targetPath);
  const seedTarget = await runMaintainerSeedInit(
    request.targetPath,
    request.force ?? false,
    dependencies,
  );
  await dependencies.fs.createDir(request.targetPath);

  const packageNames = await discoverPackageNames(sourceRoot, dependencies.fs);
  const packageSync = await syncPackages(
    {
      sourceRoot,
      targetPath: request.targetPath,
      packageNames,
      includeTests: true,
    } satisfies SyncPackagesRequest,
    dependencies.syncPackagesDependencies,
  );

  const pluginsSynced = await syncOfficialPlugins({
    sourceRoot,
    targetPath: request.targetPath,
    projectName: targetName,
    dependencies,
  });

  await syncTemplates({ targetPath: seedTarget }, dependencies.syncTemplatesDependencies);
  await dependencies.fs.remove(dirname(seedTarget));
  await removeScaffoldOnlyRoots(request.targetPath, dependencies.fs);

  const filesWritten = [
    ...await writeProducerRootFiles(request.targetPath, dependencies.fs),
    ...await resetMemberVersions(request.targetPath, dependencies.fs),
  ];

  await scaffoldPlaygroundExample(sourceRoot, request.targetPath, dependencies.process);
  await markExamplesNonPublishable(request.targetPath, dependencies.fs);

  const gitCommit = request.noGit ? null : await initializeGitRepository({
    targetPath: request.targetPath,
    process: dependencies.process,
    branch: request.branch ?? DEFAULT_BRANCH,
    remote: request.remote ?? DEFAULT_REMOTE,
    noGitleaks: request.noGitleaks ?? false,
    push: request.push ?? false,
  });

  return {
    sourceRoot,
    targetPath: request.targetPath,
    packagesCopied: packageSync.packagesCopied,
    pluginsSynced,
    filesWritten,
    gitCommit,
  };
}

async function runMaintainerSeedInit(
  targetPath: string,
  force: boolean,
  dependencies: ReleaseEjectDependencies,
): Promise<string> {
  const seedParent = join(dirname(targetPath), '.release-seed');
  const seedName = 'netscript-producer-seed';
  if (force && await dependencies.fs.exists(seedParent)) {
    await dependencies.fs.remove(seedParent);
  }
  await orchestrateMaintainerInit({
    name: seedName,
    path: seedParent,
    force,
    ci: true,
    yes: true,
    dryRun: false,
    noGit: true,
    noAspire: false,
    legacyAspire: false,
    dbEngine: 'none',
    editor: 'none',
    includeExampleService: false,
  }, dependencies.initDependencies);
  return join(seedParent, seedName);
}

function assertTargetInsideSourceRoot(targetPath: string, sourceRoot: string): void {
  const rel = relative(sourceRoot, targetPath);
  if (rel === '' || rel === '..' || rel.startsWith(`..\\`) || rel.startsWith('../')) {
    throw new Error(`release eject target must stay inside the source checkout: ${targetPath}`);
  }
}

async function discoverPackageNames(
  sourceRoot: string,
  fs: FileSystemPort,
): Promise<readonly string[]> {
  const entries = await fs.readDir(join(sourceRoot, 'packages'));
  return entries
    .filter((entry) => entry.isDirectory && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
}

async function discoverPluginKinds(
  sourceRoot: string,
  fs: FileSystemPort,
): Promise<readonly string[]> {
  const pluginsRoot = join(sourceRoot, 'plugins');
  const entries = await fs.readDir(pluginsRoot);
  const kinds: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory || entry.name.startsWith('.')) continue;
    const manifestPath = join(pluginsRoot, entry.name, 'scaffold.plugin.json');
    if (!await fs.exists(manifestPath)) continue;
    const manifest = JSON.parse(await fs.readFile(manifestPath)) as PluginManifest;
    const kind = manifest.provider?.kind;
    if (kind) kinds.push(kind);
  }
  return kinds.sort();
}

async function syncOfficialPlugins(options: {
  readonly sourceRoot: string;
  readonly targetPath: string;
  readonly projectName: string;
  readonly dependencies: ReleaseEjectDependencies;
}): Promise<readonly ReleaseEjectPluginResult[]> {
  const kinds = await discoverPluginKinds(options.sourceRoot, options.dependencies.fs);
  const results: ReleaseEjectPluginResult[] = [];
  for (const kind of kinds) {
    const result = await syncPlugin({
      sourceRoot: options.sourceRoot,
      targetPath: options.targetPath,
      projectName: options.projectName,
      kind,
      importMode: 'local',
      force: true,
      includeSamples: false,
    }, options.dependencies.syncPluginDependencies);
    results.push({ kind, name: result.pluginName });
  }
  return results;
}

async function scaffoldPlaygroundExample(
  sourceRoot: string,
  targetPath: string,
  process: ProcessPort,
): Promise<void> {
  const result = await process.exec('deno', [
    'run',
    '--allow-all',
    join(sourceRoot, 'packages/cli/bin/netscript.ts'),
    'init',
    'playground',
    '--path',
    join(targetPath, 'examples'),
    '--force',
    '--ci',
    '--yes',
    '--no-git',
    '--no-aspire',
    '--db',
    'none',
  ], { cwd: sourceRoot });
  if (result.code !== 0) {
    throw new Error(result.stderr || result.stdout || 'examples/playground scaffold failed.');
  }
}
