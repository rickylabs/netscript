import type { CliffyCommand } from '../../../../kernel/presentation/command-types.ts';
import { Command } from '@cliffy/command';

import { outputJson, outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../kernel/application/registries/template-registry.ts';
import type { PublicCommandDependencies } from '../../root/public-command-dependencies.ts';
import { requireProjectRoot } from '../../../presentation/support.ts';
import { generateAspire } from './generate-aspire.ts';
import { DenoGeneratedSourceFormatter } from '../../../../kernel/adapters/runtime/process/deno-generated-source-formatter.ts';
import { IoError, UsageError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import { checkAspire } from './check-aspire.ts';

/** Create `generate aspire`, regenerating helpers without re-scaffolding. */
export function createGenerateAspireCommand(
  dependencies: PublicCommandDependencies,
): CliffyCommand {
  return new Command().name('aspire')
    .description('Regenerate Aspire AppHost helpers from appsettings.json')
    .option('--project-root <path:string>', 'Project root directory')
    .option('--check', 'Inspect generated ownership and bytes without project writes')
    .option('--format <format:string>', 'Check report format: text or json', { depends: ['check'] })
    .action(async (options: { projectRoot?: string; check?: boolean; format?: string }) => {
      if (options.format && !['text', 'json'].includes(options.format)) {
        throw new UsageError(2, 'Check format must be text or json.');
      }
      await DEFAULT_TEMPLATE_REGISTRY.hydrate();
      const projectRoot = await requireProjectRoot(
        dependencies.resolveProjectRoot,
        options.projectRoot,
      );
      const formatter = new DenoGeneratedSourceFormatter(dependencies.process);
      if (options.check) {
        const report = await checkAspire(projectRoot, {
          fs: dependencies.fs,
          templateAdapter: dependencies.templateAdapter,
          formatter,
        });
        if (options.format === 'json') outputJson(report);
        else {
          for (const finding of report.drift) outputText(`${finding.kind}: ${finding.path}`);
          outputText(`Aspire surface ${report.status}: ${report.outputs.length} selected outputs.`);
        }
        if (report.exitCode !== 0) throw new IoError(1, `Aspire surface ${report.status}.`);
        return;
      }
      const result = await generateAspire({ projectRoot }, {
        fs: dependencies.fs,
        scaffolder: dependencies.scaffolder,
        templateAdapter: dependencies.templateAdapter,
        formatter,
      });
      outputText(`Regenerated ${result.helperFiles.length} Aspire helper files.`);
    });
}
