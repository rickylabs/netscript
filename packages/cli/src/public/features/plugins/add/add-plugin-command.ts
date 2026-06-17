import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { Command } from '@cliffy/command';
import { addPlugin, type AddPluginDependencies } from './add-plugin.ts';
import {
  parseList,
  type ProjectRootResolver,
  requireProjectRoot,
  requireString,
} from '../../../presentation/support.ts';
import type { AddPluginCommandInput } from './add-plugin-input.ts';

/** Dependencies for the public `plugin add` command handler. */
export interface PluginAddCommandDependencies {
  /** Application dependencies for adding a plugin workspace. */
  readonly addPluginDependencies: AddPluginDependencies;
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Create the public `plugin add` command. */
export function createPluginAddCommand(
  dependencies: PluginAddCommandDependencies,
): Command<any, any, any, any, any, any, any, any> {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('add')
    .description('Add a plugin workspace and register it with Aspire')
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
      const result = await addPlugin({
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

      const plugin = result.plugin;
      print(`Added ${plugin.kind} plugin "${plugin.configKey}" on port ${plugin.servicePort}.`);
      print(`Created ${plugin.scaffoldResult.filesCreated.length} plugin files.`);
      print(`Regenerated ${result.helperFiles.length} Aspire helper files.`);
    });
}
