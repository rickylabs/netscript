import { CliCommand } from '../../application/abstracts/cli-command.ts';
import type { CommandOptionDefinition } from './scaffold-command.ts';

/** Supported list command output formats. */
export type ListOutputFormat = 'table' | 'json';

/** Column descriptor used by list commands. */
export interface ListColumn<TEntry> {
  /** Column heading. */
  readonly heading: string;
  /** Render one cell for an entry. */
  readonly value: (entry: TEntry) => string;
}

/**
 * Layer-2 command base for list commands.
 *
 * Demonstrated concretes: `service list`, `plugin list`, and `contract list`.
 */
export abstract class ListCommand<TEntry, TDefinition = unknown> extends CliCommand<TDefinition> {
  /** Resource name used in empty-state messages. */
  protected abstract readonly listSubject: string;

  /** Shared output-format option. Final helper. */
  protected outputFormatOption(): CommandOptionDefinition {
    return {
      flags: '--output <format:string>',
      description: 'Output format (table | json)',
      default: 'table',
    };
  }

  /** Render tab-separated table rows. Final helper. */
  protected renderTableRows(
    entries: readonly TEntry[],
    columns: readonly ListColumn<TEntry>[],
  ): readonly string[] {
    return [
      columns.map((column) => column.heading).join('\t'),
      ...entries.map((entry) => columns.map((column) => column.value(entry)).join('\t')),
    ];
  }

  /** Shared empty-state line. Final helper. */
  protected emptyMessage(): string {
    return `No ${this.listSubject} configured.`;
  }
}
