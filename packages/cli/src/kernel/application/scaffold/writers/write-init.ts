import { join } from '@std/path';
import { SCAFFOLD_DIRS } from '../../../constants/scaffold/scaffold-dirs.ts';
import type { ScaffoldResult } from '../../../domain/core-types.ts';
import type { ValidatedInitOptions } from '../../../domain/scaffold/scaffold-options.ts';
import { normalizeFreshOutput, runFreshInit } from '../../../adapters/scaffold/fresh-adapter.ts';
import type { InitPipelineContext } from '../context.ts';
import { writeNormalizedAppFiles } from './write-app-files.ts';

export async function scaffoldApp(
  context: InitPipelineContext,
  options: ValidatedInitOptions,
): Promise<ScaffoldResult> {
  const start = performance.now();
  const filesCreated: string[] = [];
  const directoriesCreated: string[] = [];
  const filesSkipped: string[] = [];
  const appDir = join(
    options.targetPath,
    SCAFFOLD_DIRS.APPS,
    options.appName,
  );

  let freshInitSuccess = false;

  // Attempt @fresh/init subprocess (skip in dry-run or if dir is in-memory)
  if (!options.dryRun && !options.ci) {
    freshInitSuccess = await runFreshInit(appDir);
  }

  if (freshInitSuccess) {
    // Normalize Fresh output: remove demos, update deno.json
    const removed = await normalizeFreshOutput(
      appDir,
      context.fs,
      options.name,
      options.appName,
    );
    // Track normalized files — we don't know all files Fresh created,
    // but we track our modifications
    void removed; // demo files removed, not tracked as "created"
  }

  // `scaffoldRoot()` always writes a placeholder apps/<name>/deno.json so the
  // workspace is structurally valid before the app phase runs. The app phase
  // owns the final normalized Fresh files in both the @fresh/init and fallback
  // paths, so it must always overwrite those placeholders.
  const overwriteNormalizedFiles = true;

  await writeNormalizedAppFiles(
    context,
    options,
    appDir,
    overwriteNormalizedFiles,
    filesCreated,
    filesSkipped,
    directoriesCreated,
  );

  const durationMs = performance.now() - start;
  return {
    filesCreated,
    directoriesCreated,
    filesSkipped,
    totalOperations: filesCreated.length + directoriesCreated.length,
    durationMs,
  };
}
