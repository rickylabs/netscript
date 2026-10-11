/** Host-owned installed-name plugin update and regeneration flow. */
import { Command } from '@cliffy/command';
import { join } from '@std/path';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { type ProjectRootResolver, requireProjectRoot } from '../../../presentation/support.ts';
import { installPlugin, type InstallPluginDependencies } from '../install/install-plugin.ts';
import { resolveWalkerEmissions } from '../host/trigger-walker.ts';
import type { GeneratePluginRegistriesCommandDependencies } from '../../generate/plugins/generate-plugin-registries-command.ts';
import type { ProjectStagePort } from '../../../../kernel/ports/project-stage-port.ts';

export interface UpdatePluginCommandDependencies {
  readonly resolveProjectRoot: ProjectRootResolver;
  readonly installPluginDependencies: InstallPluginDependencies;
  readonly registryDependencies: GeneratePluginRegistriesCommandDependencies;
  readonly projectStage: ProjectStagePort;
  readonly print?: (message: string) => void;
}

interface UpdateOptions {
  readonly projectRoot?: string;
}

/** Create `plugin update <installed-name>`. */
export function createUpdatePluginCommand(
  dependencies: UpdatePluginCommandDependencies,
) {
  const print = dependencies.print ?? outputText;
  return new Command().name('update').description(
    'Re-pin and regenerate an installed plugin',
  )
    .arguments('<name:string>')
    .option('--project-root <path:string>', 'Project root directory')
    .action(async (options: UpdateOptions, name: string): Promise<void> => {
      const projectRoot = await requireProjectRoot(
        dependencies.resolveProjectRoot,
        options.projectRoot,
      );
      const generator = dependencies.registryDependencies;
      const stage = await dependencies.projectStage.stage(projectRoot);
      try {
        const result = await installPlugin({
          kind: name,
          pluginName: name,
          serviceReferences: [],
          pluginReferences: [],
          noDb: false,
          includeSamples: false,
          skipConfirmation: true,
          ci: true,
          projectRoot: stage.root,
          overwrite: true,
        }, dependencies.installPluginDependencies);
        const emissions = await resolveWalkerEmissions({
          projectRoot: stage.root,
          walker: generator.walker,
          extractor: generator.extractor,
          emitter: generator.emitter,
        });
        for (const emission of emissions) {
          await generator.fs.writeFile(
            join(stage.root, emission.path),
            emission.text,
          );
        }
        await stage.commit();
        const version = result.resolvedPlugin?.version ?? 'local';
        print(
          `Updated ${name} to ${version}; generated ${emissions.length} registries.`,
        );
      } finally {
        await stage.dispose();
      }
    });
}
