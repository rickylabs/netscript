import { PluginCli } from '@netscript/plugin/cli';
import type { PluginCliCommand } from '@netscript/plugin/cli';
import type { WorkersCliBackend } from './command-types.ts';
import {
  AddJobCommand,
  AddTaskCommand,
  AddWorkflowCommand,
  CompileRegistryCommand,
  ConfigEditCommand,
  ConfigPublishCommand,
  DisableCommand,
  EnableCommand,
  ListJobsCommand,
  ListTasksCommand,
  LogsCommand,
  RunJobCommand,
} from './commands.ts';

/** CLI command group for `@netscript/plugin-workers`. */
export class WorkersCli extends PluginCli {
  /** Plugin CLI name used by mounted command lists. */
  readonly name = 'workers';

  /** Human-readable CLI description. */
  readonly description = 'Background Workers plugin CLI.';

  private readonly backend?: WorkersCliBackend;

  /** Create the workers CLI with an optional host runtime backend. */
  constructor(backend?: WorkersCliBackend) {
    super();
    this.backend = backend;
  }

  /** Return plugin-owned worker commands. */
  commands(): readonly PluginCliCommand[] {
    return [
      new AddJobCommand(this.backend),
      new AddTaskCommand(this.backend),
      new AddWorkflowCommand(this.backend),
      new ListJobsCommand(this.backend),
      new ListTasksCommand(this.backend),
      new RunJobCommand(this.backend),
      new LogsCommand(this.backend),
      new ConfigEditCommand(this.backend),
      new ConfigPublishCommand(this.backend),
      new EnableCommand(this.backend),
      new DisableCommand(this.backend),
      new CompileRegistryCommand(this.backend),
    ].map((command) => ({
      name: command.definition.name,
      description: command.definition.description,
      run: (args) => command.run(args),
    }));
  }
}
