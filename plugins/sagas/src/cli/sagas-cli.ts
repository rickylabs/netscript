import { PluginCli } from '@netscript/plugin/cli';
import type { PluginCliCommand } from '@netscript/plugin/cli';
import type { SagasCliBackend } from './command-types.ts';
import {
  AddSagaCommand,
  CodemodCommand,
  GenerateRegistryCommand,
  InspectCommand,
  ListSagasCommand,
  PublishCommand,
  RemoveSagaCommand,
  UpdateSagaCommand,
} from './commands.ts';

/** CLI command group for `@netscript/plugin-sagas`. */
export class SagasCli extends PluginCli {
  /** Plugin CLI name used by mounted command lists. */
  readonly name = 'sagas';

  /** Human-readable CLI description. */
  readonly description = 'Saga orchestration plugin CLI.';

  private readonly backend?: SagasCliBackend;

  /** Create the sagas CLI with an optional host runtime backend. */
  constructor(backend?: SagasCliBackend) {
    super();
    this.backend = backend;
  }

  /** Return plugin-owned saga commands. */
  commands(): readonly PluginCliCommand[] {
    return [
      new AddSagaCommand(this.backend),
      new GenerateRegistryCommand(this.backend),
      new PublishCommand(this.backend),
      new ListSagasCommand(this.backend),
      new InspectCommand(this.backend),
      new UpdateSagaCommand(this.backend),
      new RemoveSagaCommand(this.backend),
      new CodemodCommand(this.backend),
    ].map((command) => command.toPluginCommand());
  }
}
