import { CliCommand } from '../../application/abstracts/cli-command.ts';
import type { CommandOptionDefinition } from './scaffold-command.ts';

/** Deploy lifecycle phases represented by public deploy commands. */
export type DeployLifecyclePhase =
  | 'build'
  | 'copy'
  | 'install'
  | 'start'
  | 'stop'
  | 'logs'
  | 'status'
  | 'upgrade'
  | 'uninstall';

/**
 * Layer-2 command base for deploy step commands.
 *
 * Demonstrated concretes: deploy build/install/uninstall and deploy upgrade
 * lifecycle steps.
 */
export abstract class DeployStepCommand<TDefinition = unknown> extends CliCommand<TDefinition> {
  /** Lifecycle phase owned by the concrete deploy command. */
  protected abstract readonly phase: DeployLifecyclePhase;

  /** Shared project-root option for deploy commands. Final helper. */
  protected projectRootOption(): CommandOptionDefinition {
    return {
      flags: '--project-root <path:string>',
      description: 'Project root directory',
    };
  }

  /** Shared service-name option for commands targeting a single service. Final helper. */
  protected serviceNameOption(): CommandOptionDefinition {
    return {
      flags: '--service <name:string>',
      description: `Service name for deploy ${this.phase}`,
    };
  }
}
