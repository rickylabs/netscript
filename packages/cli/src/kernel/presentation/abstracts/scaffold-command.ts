import { CliCommand } from '../../application/abstracts/cli-command.ts';

/** Shared option descriptor for command definitions. */
export interface CommandOptionDefinition {
  /** CLI flag syntax, for example `--project-root <path:string>`. */
  readonly flags: string;
  /** User-facing option description. */
  readonly description: string;
  /** Optional default value used by the command adapter. */
  readonly default?: unknown;
}

/**
 * Layer-2 command base for scaffold-style commands.
 *
 * Demonstrated concretes: `init`, `service add`, `plugin install`, and `db add`.
 */
export abstract class ScaffoldCommand<TDefinition = unknown> extends CliCommand<TDefinition> {
  /** Resource name used in generated descriptions and diagnostics. */
  protected abstract readonly scaffoldSubject: string;

  /** Shared scaffold flags. Final helper. */
  protected scaffoldOptions(): readonly CommandOptionDefinition[] {
    return [
      {
        flags: '--project-root <path:string>',
        description: 'Project root directory',
      },
      {
        flags: '--force',
        description: 'Overwrite generated files if they already exist',
        default: false,
      },
      {
        flags: '--dry-run',
        description: `Preview ${this.scaffoldSubject} changes without writing files`,
        default: false,
      },
      {
        flags: '-y, --yes',
        description: 'Accept defaults without prompting',
        default: false,
      },
    ];
  }
}
