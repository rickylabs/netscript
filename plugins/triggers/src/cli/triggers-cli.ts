import { PluginCli } from '@netscript/plugin/cli';
import type { PluginCliCommand } from '@netscript/plugin/cli';
import type { TriggersCliBackend } from './command-types.ts';
import {
  AddFileWatchCommand,
  AddScheduledCommand,
  AddWebhookCommand,
  DisableTriggerCommand,
  EnableTriggerCommand,
  FireTriggerCommand,
  ListTriggersCommand,
  PreviewScheduleCommand,
  TestTriggerCommand,
} from './commands.ts';

/** CLI command group for `@netscript/plugin-triggers`. */
export class TriggersCli extends PluginCli {
  /** Plugin CLI name used by mounted command lists. */
  readonly name = 'triggers';

  /** Human-readable CLI description. */
  readonly description = 'Trigger ingress and scheduling plugin CLI.';

  private readonly backend?: TriggersCliBackend;

  /** Create the triggers CLI with an optional host runtime backend. */
  constructor(backend?: TriggersCliBackend) {
    super();
    this.backend = backend;
  }

  /** Return plugin-owned trigger commands. */
  commands(): readonly PluginCliCommand[] {
    return [
      new AddWebhookCommand(this.backend),
      new AddFileWatchCommand(this.backend),
      new AddScheduledCommand(this.backend),
      new ListTriggersCommand(this.backend),
      new TestTriggerCommand(this.backend),
      new FireTriggerCommand(this.backend),
      new PreviewScheduleCommand(this.backend),
      new EnableTriggerCommand(this.backend),
      new DisableTriggerCommand(this.backend),
    ].map((command) => command.toPluginCommand());
  }
}
