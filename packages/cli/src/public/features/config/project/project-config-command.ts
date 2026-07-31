import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';
import { join } from '@std/path';

import {
  outputJson,
  outputText,
  outputWarning,
} from '../../../../kernel/presentation/output/default-output.ts';
import type { PublicCommandDependencies } from '../../root/public-command-dependencies.ts';
import { listAppsettingsPaths } from './list-appsettings-paths.ts';
import {
  getDottedValue,
  inspectProjectConfig,
  readAppsettingsDocument,
  readAppsettingsValue,
  setProjectConfigValue,
} from './project-config-ops.ts';
import { requireProjectRoot } from '../../../presentation/support.ts';

/** Create project configuration read/write commands. */
export function createProjectConfigCommands(
  dependencies: PublicCommandDependencies,
): readonly CliffyCommand[] {
  const inspect = new Command().name('inspect')
    .description('Inspect the resolved project configuration')
    .option('--project-root <path:string>', 'Project root directory')
    .option('--json', 'Emit the JSON-stable InspectionReport')
    .action(async (options: { projectRoot?: string; json?: boolean }) => {
      const root = await resolveRoot(dependencies, options.projectRoot);
      const report = inspectProjectConfig(await dependencies.loadConfig({ cwd: root }));
      options.json ? outputJson(report) : outputText(report.summary);
    });

  const list = new Command().name('list').arguments('[filter:string]')
    .description('List the canonical appsettings paths the generator reads')
    .option('--project-root <path:string>', 'Project root directory')
    .option('--json', 'Emit JSON')
    .action(async (options: { projectRoot?: string; json?: boolean }, filter?: string) => {
      const root = await resolveRoot(dependencies, options.projectRoot);
      const document = await readAppsettingsDocument(dependencies.fs, appsettingsFile(root));
      const entries = listAppsettingsPaths(document, filter);
      if (options.json) {
        outputJson(entries);
        return;
      }
      for (const entry of entries) {
        const value = entry.value === undefined ? '' : JSON.stringify(entry.value);
        const marker = entry.status === 'unknown' ? '\t(not read by the generator)' : '';
        outputText(`${entry.path}\t${value}${marker}`);
      }
    });

  const get = new Command().name('get').arguments('<path:string>')
    .description('Read a resolved project configuration value')
    .option('--project-root <path:string>', 'Project root directory')
    .option('--json', 'Emit JSON')
    .action(async (options: { projectRoot?: string; json?: boolean }, path: string) => {
      const root = await resolveRoot(dependencies, options.projectRoot);
      const config = await dependencies.loadConfig({ cwd: root });
      let value = getDottedValue(config, path);
      if (value === undefined) value = await readAppsettingsValue(dependencies.fs, root, path);
      if (value === undefined) throw new Error(`Config path not found: ${path}`);
      options.json || typeof value !== 'string' ? outputJson(value) : outputText(value);
    });

  const set = new Command().name('set').arguments('<path:string> <value:string>')
    .description('Set a generated appsettings configuration value')
    .option('--project-root <path:string>', 'Project root directory')
    .option('--force', 'Write the key even when the generator does not read it')
    .action(
      async (options: { projectRoot?: string; force?: boolean }, path: string, value: string) => {
        const root = await resolveRoot(dependencies, options.projectRoot);
        const result = await setProjectConfigValue(dependencies.fs, root, path, parseValue(value), {
          force: options.force,
        });
        if (result.forced) {
          outputWarning(
            `Warning: the Aspire generator does not read ${result.canonicalPath}; ` +
              'this setting will have no effect on generated output.',
          );
        }
        outputText(
          result.canonicalPath === result.requestedPath
            ? `Set ${result.canonicalPath}.`
            : `Set ${result.canonicalPath} (resolved from ${result.requestedPath}).`,
        );
      },
    );

  return [inspect, list, get, set];
}

async function resolveRoot(
  dependencies: PublicCommandDependencies,
  value?: string,
): Promise<string> {
  return await requireProjectRoot(dependencies.resolveProjectRoot, value);
}

function appsettingsFile(root: string): string {
  return join(root, 'appsettings.json');
}

function parseValue(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}
