import type { TriggersCliBackend } from './command-types.ts';
import { TriggersCliCommand } from './commands.ts';

/** List persisted trigger events from the running triggers service. */
export class ListTriggerEventsCommand extends TriggersCliCommand {
  /** Create the persisted event-ledger command. */
  constructor(backend?: TriggersCliBackend) {
    super({
      name: 'events',
      category: 'inspection',
      description: 'List persisted trigger events from the running service.',
      usage: 'ns-triggers events [<trigger-id>] [--status=<status> --limit=<n> --json]',
      flags: [
        { name: 'status', description: 'Filter by persisted event status.' },
        { name: 'limit', description: 'Maximum number of events to return.' },
        { name: 'json', description: 'Request machine-readable output.' },
      ],
    }, backend);
  }
}

/** Update a code-defined trigger and rebuild its registry. */
export class UpdateTriggerCommand extends TriggersCliCommand {
  /** Create the trigger update command. */
  constructor(backend?: TriggersCliBackend) {
    super({
      name: 'update',
      category: 'scaffolding',
      description: 'Update a code-defined trigger and rebuild its registry.',
      usage:
        'ns-triggers update <trigger-id> [--cron=<expr> --timezone=<iana> --path=<path> --secret-env=<name>]',
      flags: [
        { name: 'cron', description: 'Replacement five-field cron expression.' },
        { name: 'timezone', description: 'Replacement IANA timezone.' },
        { name: 'path', description: 'Replacement webhook route path.' },
        { name: 'verifier', description: 'Replacement webhook verifier id.' },
        { name: 'secret-env', description: 'Replacement webhook secret environment variable.' },
        { name: 'description', description: 'Replacement trigger description.' },
        { name: 'tags', description: 'Replacement comma-separated trigger tags.' },
      ],
    }, backend);
  }
}

/** Remove a code-defined trigger and rebuild its registry. */
export class RemoveTriggerCommand extends TriggersCliCommand {
  /** Create the trigger removal command. */
  constructor(backend?: TriggersCliBackend) {
    super({
      name: 'remove',
      category: 'scaffolding',
      description: 'Remove a code-defined trigger and rebuild its registry.',
      usage: 'ns-triggers remove <trigger-id>',
    }, backend);
  }
}
