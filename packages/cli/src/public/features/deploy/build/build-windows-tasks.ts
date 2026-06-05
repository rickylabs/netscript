import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { bold, gray, green, yellow } from '@std/fmt/colors';
import type { ResolvedConfig } from '../../../../kernel/domain/resolved-config.ts';
import {
  copyTaskFiles,
  TASKS_OUTPUT_DIR,
} from '../../../../kernel/adapters/windows/tasks-copier.ts';
import type { WindowsBuildOptions } from './build-windows-options.ts';

interface WorkersPluginConfigSection {
  readonly tasksDir?: string;
}

export async function copyWindowsTaskFiles(
  config: ResolvedConfig,
  options: WindowsBuildOptions,
  binDir: string,
): Promise<void> {
  // ── Step 1c: Copy task script files to bin/tasks/ ────────────────────────
  if (options.copyTasks !== false) {
    outputText(bold('📦 Copying task script files...'));

    // Collect packaged runtime task script directories from netscript.config.ts
    const tasksDirs: string[] = [];
    const workersConfig = config.netscriptConfig['workers'] as
      | WorkersPluginConfigSection
      | undefined;
    const workersTasksDir = workersConfig?.tasksDir;
    if (workersTasksDir) tasksDirs.push(workersTasksDir);

    if (tasksDirs.length === 0) {
      outputText(gray('   No tasksDir configured — skipping'));
    } else {
      const taskResult = await copyTaskFiles({
        projectRoot: config.projectRoot,
        binDir,
        tasksDirs,
        includePaths: options.includeTasks,
        excludeNames: options.excludeTasks,
        verbose: options.verbose,
      });

      if (taskResult.copied > 0) {
        outputText(
          `   ${green('✓')} Copied ${taskResult.copied} task file(s) to ${TASKS_OUTPUT_DIR}/` +
            (taskResult.skipped > 0 ? ` (${taskResult.skipped} unchanged)` : ''),
        );
      } else if (taskResult.skipped > 0) {
        outputText(`   ✓ All ${taskResult.skipped} task file(s) up to date`);
      } else {
        outputText(gray('   No task files found'));
      }

      if (taskResult.errors.length > 0) {
        for (const err of taskResult.errors) {
          outputText(`   ${yellow('⚠')} ${err}`);
        }
      }
    }

    outputText('');
  }
}
