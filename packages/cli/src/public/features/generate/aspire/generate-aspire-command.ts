import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';

import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../kernel/application/registries/template-registry.ts';
import type { PublicCommandDependencies } from '../../root/public-command-dependencies.ts';
import { requireProjectRoot } from '../../../presentation/support.ts';
import { generateAspire } from './generate-aspire.ts';
import { formatGeneratedFiles } from '../../../../kernel/application/scaffold/support/format-generated-files.ts';

/** Create `generate aspire`, regenerating helpers without re-scaffolding. */
export function createGenerateAspireCommand(
  dependencies: PublicCommandDependencies,
): CliffyCommand {
  return new Command().name('aspire')
    .description('Regenerate Aspire AppHost helpers from appsettings.json')
    .option('--project-root <path:string>', 'Project root directory')
    .action(async (options: { projectRoot?: string }) => {
      await DEFAULT_TEMPLATE_REGISTRY.hydrate();
      const projectRoot = await requireProjectRoot(
        dependencies.resolveProjectRoot,
        options.projectRoot,
      );
      const result = await generateAspire({ projectRoot }, {
        fs: dependencies.fs,
        scaffolder: dependencies.scaffolder,
        templateAdapter: dependencies.templateAdapter,
      });
      await formatGeneratedFiles(
        dependencies.process,
        projectRoot,
        result.helperFiles,
        (path) => dependencies.fs.exists(path),
      );
      outputText(`Regenerated ${result.helperFiles.length} Aspire helper files.`);
    });
}
