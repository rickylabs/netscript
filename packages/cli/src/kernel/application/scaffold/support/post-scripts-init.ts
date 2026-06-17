import { outputWarning } from '../../../presentation/output/default-output.ts';
import type { ScaffoldResult } from '../../../domain/core-types.ts';
import type { InitPipelineContext } from '../context.ts';
import { collectFormattableScaffoldFiles } from './helpers.ts';

/** Format generated scaffold output after all write phases finish. */
export async function formatOutput(
  context: InitPipelineContext,
  targetPath: string,
  phases: readonly ScaffoldResult[],
): Promise<void> {
  const filesToFormat = collectFormattableScaffoldFiles(targetPath, phases);
  if (filesToFormat.length === 0) return;

  try {
    const result = await context.process.exec('deno', ['fmt', ...filesToFormat], {
      cwd: targetPath,
    });
    if (result.code !== 0) {
      const stderr = result.stderr.trim();
      outputWarning(`  ⚠  deno fmt reported issues (run 'deno fmt' manually to fix):\n     ${stderr}`);
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    outputWarning(`  ⚠  deno fmt could not be executed: ${msg}`);
  }
}
