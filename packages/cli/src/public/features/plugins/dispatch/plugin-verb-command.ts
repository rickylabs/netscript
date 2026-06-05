import { Command } from '@cliffy/command';

import { CliCommand } from '../../../../kernel/application/abstracts/cli-command.ts';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import type { ProjectRootResolver } from '../../../presentation/support.ts';
import { requireProjectRoot } from '../../../presentation/support.ts';
import { dispatchPluginVerb, type FrameworkVerb } from './dispatch-plugin-verb.ts';
import type { PluginDispatchOptions, PluginDispatchResult } from './plugin-dispatch-port.ts';

/** Dependencies for a framework plugin verb command. */
export interface PluginVerbCommandDependencies {
  /** Framework-owned plugin verb. */
  readonly verb: FrameworkVerb;
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** Dispatch override used by tests. */
  readonly dispatch?: (
    verb: FrameworkVerb,
    pkg: string,
    args: readonly string[],
    options: Pick<PluginDispatchOptions, 'projectRoot' | 'processRunner'>,
  ) => Promise<PluginDispatchResult | void>;
  /** Process runner used by the default dispatch implementation. */
  readonly processRunner: PluginDispatchOptions['processRunner'];
  /** Output sink for plugin stdout/stderr. */
  readonly print?: (message: string, stream?: 'stdout' | 'stderr') => void;
}

/** Cliffy command adapter for one framework-owned plugin verb. */
export class PluginVerbCommand extends CliCommand<Command> {
  /** Stable command identifier. */
  readonly id: string;

  constructor(private readonly dependencies: PluginVerbCommandDependencies) {
    super();
    this.id = `plugin.${dependencies.verb}`;
  }

  /** Build the command definition consumed by the CLI runner. */
  define(): Command {
    const dispatch = this.dependencies.dispatch ?? dispatchPluginVerb;
    const print = this.dependencies.print ?? outputText;
    return new Command()
      .name(this.dependencies.verb)
      .description(`Run plugin ${this.dependencies.verb} through its published CLI`)
      .arguments('<pkg:string> [...args:string]')
      .option('--project-root <path:string>', 'Project root directory')
      .action(async (options: { projectRoot?: string }, pkg: string, ...args: string[]) => {
        const projectRoot = await requireProjectRoot(
          this.dependencies.resolveProjectRoot,
          options.projectRoot,
        );
        const result = await dispatch(this.dependencies.verb, pkg, args, {
          projectRoot,
          processRunner: this.dependencies.processRunner,
        });
        if (result?.stdout) {
          print(result.stdout, 'stdout');
        }
        if (result?.stderr) {
          print(result.stderr, 'stderr');
        }
      }) as unknown as Command;
  }
}

/** Create a framework plugin verb command. */
export function createPluginVerbCommand(
  dependencies: PluginVerbCommandDependencies,
): Command {
  return new PluginVerbCommand(dependencies).define();
}
