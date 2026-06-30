import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { Command } from '@cliffy/command';
import {
  parseList,
  type ProjectRootResolver,
  requireProjectRoot,
  requireString,
} from '../../../../public/presentation/support.ts';
import type { InstallPluginCommandInput } from '../../../../public/features/plugins/install/install-plugin-input.ts';
import { installLocalPlugin, type InstallLocalPluginDependencies } from './install-local-plugin.ts';

/** Dependencies for the local contributor `plugin install` command handler. */
export interface LocalPluginInstallCommandDependencies {
  /** Application dependencies for installing a plugin workspace. */
  readonly installPluginDependencies: InstallLocalPluginDependencies;
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** Directory used to resolve the default local plugin source path. */
  readonly sourceRootStartDir: string;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Create the local contributor `plugin install` command. */
export function createLocalPluginInstallCommand(
  dependencies: LocalPluginInstallCommandDependencies,
) {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('install')
    .description('Install a plugin workspace and register it with local contributor wiring')
    .arguments('<kind:string>')
    .option('--name <name:string>', 'Plugin name (kebab-case)')
    .option('--port <port:number>', 'Plugin port override')
    .option('--service-refs <refs:string>', 'Comma-separated service references')
    .option('--plugin-refs <refs:string>', 'Comma-separated plugin references')
    .option('--db <engine:string>', 'Database engine or config key to provision or target')
    .option('--no-db', 'Skip database provisioning and DB wiring')
    .option('--saga-store-backend <backend:string>', 'Saga durable store backend: kv or prisma')
    .option('--samples', 'Scaffold plugin sample files', { default: true })
    .option('--no-samples', 'Skip plugin sample files')
    .option('--dry-run', 'Preview plugin-owned scaffold changes without writing files', {
      default: false,
    })
    .option('--jsr-url <specifier:string>', 'Install the plugin from an explicit JSR package')
    .option('--local-path <path:string>', 'Install the plugin from a local package directory')
    .option(
      '--no-copy-source',
      'Generate a thin local-import stub instead of copying the official plugin source tree.',
    )
    .option('--project-root <path:string>', 'Project root directory')
    .option('--force', 'Overwrite generated files if they already exist', { default: false })
    .action(async (options: InstallPluginCommandInput, kind: string): Promise<void> => {
      const projectRoot = await requireProjectRoot(
        dependencies.resolveProjectRoot,
        options.projectRoot,
      );
      const pluginName = requireString('--name', options.name);
      const result = await installLocalPlugin({
        kind,
        pluginName,
        port: options.port,
        serviceReferences: parseList(options.serviceRefs),
        pluginReferences: parseList(options.pluginRefs),
        db: typeof options.db === 'string' ? options.db : undefined,
        noDb: options.db === false,
        sagaStoreBackend: parseSagaStoreBackendOption(options.sagaStoreBackend),
        includeSamples: options.samples !== false,
        dryRun: options.dryRun ?? false,
        jsrUrl: options.jsrUrl,
        localPath: options.localPath,
        noCopySource: options.copySource === false,
        projectRoot,
        overwrite: options.force ?? false,
      }, dependencies.installPluginDependencies);

      print(
        `Installed ${result.plugin.kind} plugin "${result.plugin.configKey}" on port ${result.plugin.servicePort}.`,
      );
      print(`Created ${result.plugin.scaffoldResult.filesCreated.length} plugin files.`);
      print(`Regenerated ${result.helperFiles.length} Aspire helper files.`);
    });
}

function parseSagaStoreBackendOption(value: string | undefined): 'kv' | 'prisma' | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'kv' || normalized === 'prisma') return normalized;
  throw new Error(`Invalid --saga-store-backend "${value}". Expected kv or prisma.`);
}
