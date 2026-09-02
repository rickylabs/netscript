import { Command } from '@cliffy/command';
import { CliCommand } from '../../../../kernel/application/abstracts/cli-command.ts';
import { CliExitError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import type { CliffyCommand } from '../../../../kernel/presentation/command-types.ts';
import { outputJson, outputText } from '../../../../kernel/presentation/output/default-output.ts';
import {
  generateResource,
  type GenerateResourceDependencies,
  type GenerateResourceResult,
} from './generate-resource.ts';
import {
  type GenerateResourceCommandInput,
  toGenerateResourceRequest,
} from './generate-resource-input.ts';

/** Dependencies for the public `generate resource` command. */
export interface GenerateResourceCommandDependencies {
  readonly generateResourceDependencies: GenerateResourceDependencies;
  readonly printJson?: (value: unknown) => void;
  readonly printText?: (message: string) => void;
}

/** Typed nonzero result consumed by the binary process boundary. */
export class ResourceSliceConflictError extends CliExitError {
  override readonly exitCode = 1;

  constructor(readonly result: GenerateResourceResult) {
    super(`Resource slice has ${result.conflicts.length} unresolved conflict(s).`, {
      context: { conflicts: result.conflicts.join(', ') },
    });
  }
}

/** Public `generate resource` command definition owner. */
export class GenerateResourceCommand extends CliCommand<CliffyCommand> {
  readonly id = 'public.generate.resource';

  constructor(private readonly dependencies: GenerateResourceCommandDependencies) {
    super();
  }

  define(): CliffyCommand {
    const printJson = this.dependencies.printJson ?? outputJson;
    const printText = this.dependencies.printText ?? outputText;
    return new Command()
      .name('resource')
      .description('Generate a typed Fresh resource slice from a query procedure')
      .arguments('<resource:string>')
      .option('--procedure <path:string>', 'Named query procedure path', { required: true })
      .option('--client <service:string>', 'Generated service client name')
      .option('--app <name:string>', 'Fresh app workspace name')
      .option('--project-root <path:string>', 'Fresh application root')
      .option('--route <path:string>', 'Static absolute route (defaults to /<resource>)')
      .option('--form', 'Include the managed form layer', { default: false })
      .option('--partial', 'Include the deferred summary partial', { default: false })
      .option('--stream', 'Include the live stream layer', { default: false })
      .option('--dry-run', 'Report the complete plan without application writes', {
        default: false,
      })
      .option('--force', 'Replace divergent generator-owned leaves only', { default: false })
      .option('--json', 'Emit one machine-readable result', { default: false })
      .action(async (options: GenerateResourceCommandInput, resource: string): Promise<void> => {
        const result = await generateResource(
          toGenerateResourceRequest(resource, options),
          this.dependencies.generateResourceDependencies,
        );
        if (options.json) printJson(result);
        else reportText(result, printText);
        if (result.exitCode !== 0) throw new ResourceSliceConflictError(result);
      });
  }
}

/** Create the public `generate resource` command without registering it. */
export function createGenerateResourceCommand(
  dependencies: GenerateResourceCommandDependencies,
): CliffyCommand {
  return new GenerateResourceCommand(dependencies).define();
}

function reportText(
  result: GenerateResourceResult,
  print: (message: string) => void,
): void {
  for (const entry of result.report) {
    const remedy = entry.remedy ? ` ${entry.remedy}` : '';
    print(`${entry.action.toUpperCase()} ${entry.path} [${entry.classification}]${remedy}`);
  }
  print(
    `Resource slice ${result.status}: ${result.written.length} written, ` +
      `${result.skipped.length} skipped, ${result.conflicts.length} conflicts.`,
  );
}
