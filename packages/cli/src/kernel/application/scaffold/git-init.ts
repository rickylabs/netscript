import { ScaffoldGitError } from '../../domain/errors.ts';
import type { InitPipelineContext } from './context.ts';

export async function gitInit(context: InitPipelineContext, targetPath: string): Promise<void> {
  try {
    const initResult = await context.process.exec('git', ['init'], { cwd: targetPath });
    if (initResult.code !== 0) {
      throw new ScaffoldGitError(
        initResult.stderr.trim() ||
          'git init exited with non-zero status',
      );
    }

    await context.process.exec('git', ['add', '.'], { cwd: targetPath });

    await context.process.exec('git', ['commit', '-m', 'chore: scaffold NetScript project'], {
      cwd: targetPath,
    });
  } catch (error: unknown) {
    // Re-throw ScaffoldGitError as-is; wrap everything else (e.g. "git not
    // found", invalid cwd) so callers always get the --no-git guidance.
    if (error instanceof ScaffoldGitError) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new ScaffoldGitError(
      `${message} — is git installed? Use --no-git to skip.`,
    );
  }
}
