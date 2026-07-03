/**
 * @module public/features/deploy/build/prepare-deploy-build
 *
 * OS-neutral deploy-build orchestration core shared by every bare-metal deploy
 * target (Windows Servy, Linux systemd). Prepares the deploy directory layout
 * and derives the dependency-ordered compile-target set from a ResolvedConfig —
 * the steps that are identical regardless of the host service manager.
 *
 * The per-OS service-definition emission (Servy XML vs systemd units) is layered
 * on top by each target strategy; this module deliberately knows nothing about
 * either. Extracting it (S7) lets the Linux build strategy (S8) reuse the same
 * preparation without duplicating the Windows orchestrator.
 */

import { join } from '@std/path';
import { DEPLOY_DIRS } from '../../../../kernel/constants/runtime.ts';
import type { CompileTarget } from '../../../../kernel/domain/deploy/compile-target.ts';
import type { ResolvedConfig } from '../../../../kernel/domain/resolved-config.ts';
import { extractCompileTargets } from '../../../../kernel/adapters/deploy/compile/compile-targets.ts';
import { topologicalSort } from '../../../../kernel/adapters/windows/manifest/manifest.ts';

/** The four standard deploy output subdirectories under a deploy root. */
export interface DeployBuildDirs {
  readonly binDir: string;
  readonly configDir: string;
  readonly logsDir: string;
  readonly scriptsDir: string;
}

/** Result of {@link prepareDeployBuild}: the dir layout plus the ordered targets. */
export interface PreparedDeployBuild extends DeployBuildDirs {
  /** Targets to build, dependency-ordered, with `--skip` filtering applied. */
  readonly sortedTargets: CompileTarget[];
  /** Names excluded by the `--skip` filter (for reporting). */
  readonly skipped: string[];
}

/** Compute the four deploy output subdirectory paths for a deploy root (pure). */
export function deployBuildDirs(deployDir: string): DeployBuildDirs {
  return {
    binDir: join(deployDir, DEPLOY_DIRS.BIN),
    configDir: join(deployDir, DEPLOY_DIRS.CONFIG),
    logsDir: join(deployDir, DEPLOY_DIRS.LOGS),
    scriptsDir: join(deployDir, DEPLOY_DIRS.SCRIPTS),
  };
}

/** Options consumed by {@link prepareDeployBuild} (a subset of the build options). */
export interface PrepareDeployBuildOptions {
  readonly deployDir: string;
  readonly skipServices?: readonly string[];
}

/**
 * Create the deploy directory layout and derive the ordered, skip-filtered
 * compile-target set from a ResolvedConfig. OS-neutral: the caller (per-OS
 * strategy) is responsible for compilation and service-definition emission.
 */
export async function prepareDeployBuild(
  config: ResolvedConfig,
  options: PrepareDeployBuildOptions,
): Promise<PreparedDeployBuild> {
  const dirs = deployBuildDirs(options.deployDir);

  await Promise.all([
    Deno.mkdir(dirs.binDir, { recursive: true }),
    Deno.mkdir(dirs.configDir, { recursive: true }),
    Deno.mkdir(dirs.logsDir, { recursive: true }),
    Deno.mkdir(dirs.scriptsDir, { recursive: true }),
  ]);

  const allTargets = extractCompileTargets(config);
  const skipSet = new Set(options.skipServices ?? []);
  const targets = skipSet.size > 0
    ? allTargets.filter((t) => !skipSet.has(t.name))
    : allTargets;
  const skipped = skipSet.size > 0
    ? allTargets.filter((t) => skipSet.has(t.name)).map((t) => t.name)
    : [];

  return { ...dirs, sortedTargets: topologicalSort(targets), skipped };
}
