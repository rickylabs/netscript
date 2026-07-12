import { Command } from '@cliffy/command';
import { join } from '@std/path';

import { outputJson, outputText } from '../../../../kernel/presentation/output/default-output.ts';
import type { PublicCommandDependencies } from '../../root/public-command-dependencies.ts';
import {
  appsettingsPath,
  getDottedValue,
  inspectProjectConfig,
  setProjectConfigValue,
} from './project-config-ops.ts';
import { requireProjectRoot } from '../../../presentation/support.ts';

/** Create project configuration read/write commands. */
export function createProjectConfigCommands(
  dependencies: PublicCommandDependencies,
): readonly Command<any, any, any, any, any, any, any, any>[] {
  const inspect = new Command().name('inspect')
    .description('Inspect the resolved project configuration')
    .option('--project-root <path:string>', 'Project root directory')
    .option('--json', 'Emit the JSON-stable InspectionReport')
    .action(async (options: { projectRoot?: string; json?: boolean }) => {
      const root = await resolveRoot(dependencies, options.projectRoot);
      const report = inspectProjectConfig(await dependencies.loadConfig({ cwd: root }));
      options.json ? outputJson(report) : outputText(report.summary);
    });

  const get = new Command().name('get').arguments('<path:string>')
    .description('Read a resolved project configuration value')
    .option('--project-root <path:string>', 'Project root directory')
    .option('--json', 'Emit JSON')
    .action(async (options: { projectRoot?: string; json?: boolean }, path: string) => {
      const root = await resolveRoot(dependencies, options.projectRoot);
      const config = await dependencies.loadConfig({ cwd: root });
      let value = getDottedValue(config, path);
      if (value === undefined) value = await readAppsettingsValue(dependencies, root, path);
      if (value === undefined) throw new Error(`Config path not found: ${path}`);
      options.json || typeof value !== 'string' ? outputJson(value) : outputText(value);
    });

  const set = new Command().name('set').arguments('<path:string> <value:string>')
    .description('Set a generated appsettings configuration value')
    .option('--project-root <path:string>', 'Project root directory')
    .action(async (options: { projectRoot?: string }, path: string, value: string) => {
      const root = await resolveRoot(dependencies, options.projectRoot);
      await setProjectConfigValue(dependencies.fs, root, path, parseValue(value));
      outputText(`Set ${path}.`);
    });

  return [inspect, get, set];
}

async function resolveRoot(
  dependencies: PublicCommandDependencies,
  value?: string,
): Promise<string> {
  return await requireProjectRoot(dependencies.resolveProjectRoot, value);
}

async function readAppsettingsValue(
  dependencies: PublicCommandDependencies,
  root: string,
  path: string,
): Promise<unknown> {
  const file = join(root, 'appsettings.json');
  if (!await dependencies.fs.exists(file)) return undefined;
  return getDottedValue(JSON.parse(await dependencies.fs.readFile(file)), appsettingsPath(path).join('.'));
}

function parseValue(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}
