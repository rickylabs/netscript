import { Command } from '@cliffy/command';
import { CliCommand } from '../../../../kernel/application/abstracts/cli-command.ts';
import type { UiAppRootInput } from '../../../../kernel/application/ui/resolve-ui-app-root.ts';
import type { CliffyCommand } from '../../../../kernel/presentation/command-types.ts';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { requireUiAppRoot, type UiAppRootResolver } from '../../../presentation/support.ts';

/** Completion summary from the existing Fresh manifest writer. */
export interface GenerateRoutesResult {
  /** Whether either derived module changed. */
  readonly changed: boolean;
  /** Number of filesystem routes discovered. */
  readonly routeCount: number;
}

/** Injected application selection and Fresh generation effects. */
export interface GenerateRoutesCommandDependencies {
  /** Resolve one Fresh application using the shared UI selection rules. */
  readonly resolveUiAppRoot: UiAppRootResolver;
  /** Reconstruct the selected application's derived route modules. */
  readonly writeManifest: (appRoot: string) => Promise<GenerateRoutesResult>;
  /** Print the completion summary. */
  readonly print?: (message: string) => void;
}

/** Public route-generation command definition owner. */
export class GenerateRoutesCommand extends CliCommand<CliffyCommand> {
  readonly id = 'public.generate.routes';

  constructor(private readonly dependencies: GenerateRoutesCommandDependencies) {
    super();
  }

  define(): CliffyCommand {
    const print = this.dependencies.print ?? outputText;
    return new Command()
      .name('routes')
      .description('Regenerate Fresh route manifest and routes modules without a Vite build')
      .option('--app <name:string>', 'Fresh app workspace name')
      .option('--project-root <path:string>', 'Explicit Fresh application root')
      .action(async (options: UiAppRootInput): Promise<void> => {
        const appRoot = await requireUiAppRoot(this.dependencies.resolveUiAppRoot, options);
        const result = await this.dependencies.writeManifest(appRoot);
        print(
          `Route generation complete: ${result.routeCount} routes, ` +
            `${result.changed ? 'updated' : 'unchanged'}.`,
        );
      });
  }
}

/** Create the public route-generation command without registering it. */
export function createGenerateRoutesCommand(
  dependencies: GenerateRoutesCommandDependencies,
): CliffyCommand {
  return new GenerateRoutesCommand(dependencies).define();
}
