import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { Command } from '@cliffy/command';
import {
  parseList,
  type ProjectRootResolver,
  requireProjectRoot,
  requireString,
} from '../../../../public/presentation/support.ts';
import type { AddPluginCommandInput } from '../../../../public/features/plugins/add/add-plugin-input.ts';
import { addLocalPlugin, type AddLocalPluginDependencies } from './add-local-plugin.ts';

/** Dependencies for the local contributor `plugin add` command handler. */
export interface LocalPluginAddCommandDependencies {
  /** Application dependencies for adding a plugin workspace. */
  readonly addPluginDependencies: AddLocalPluginDependencies;
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Create the local contributor `plugin add` command. */
export function createLocalPluginAddCommand(
  dependencies: LocalPluginAddCommandDependencies,
) {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('add')
    .description('Add a plugin workspace and register it with local contributor wiring')
    .arguments('<kind:string>')
    .option('--name <name:string>', 'Plugin name (kebab-case)')
    .option('--port <port:number>', 'Plugin port override')
    .option('--service-refs <refs:string>', 'Comma-separated service references')
    .option('--plugin-refs <refs:string>', 'Comma-separated plugin references')
    .option('--db <engine:string>', 'Database engine or config key to provision or target')
    .option('--no-db', 'Skip database provisioning and DB wiring')
    .option('--samples', 'Scaffold plugin sample files', { default: true })
    .option('--no-samples', 'Skip plugin sample files')
    .option('--project-root <path:string>', 'Project root directory')
    .option('--force', 'Overwrite generated files if they already exist', { default: false })
    .action(async (options: AddPluginCommandInput, kind: string): Promise<void> => {
      const projectRoot = await requireProjectRoot(
        dependencies.resolveProjectRoot,
        options.projectRoot,
      );
      const pluginName = requireString('--name', options.name);
      const result = await addLocalPlugin({
        kind,
        pluginName,
        port: options.port,
        serviceReferences: parseList(options.serviceRefs),
        pluginReferences: parseList(options.pluginRefs),
        db: typeof options.db === 'string' ? options.db : undefined,
        noDb: options.db === false,
        includeSamples: options.samples !== false,
        projectRoot,
        overwrite: options.force ?? false,
      }, dependencies.addPluginDependencies);

      print(
        `Added ${result.plugin.kind} plugin "${result.plugin.configKey}" on port ${result.plugin.servicePort}.`,
      );
      print(`Created ${result.plugin.scaffoldResult.filesCreated.length} plugin files.`);
      print(`Regenerated ${result.helperFiles.length} Aspire helper files.`);
    });
}
