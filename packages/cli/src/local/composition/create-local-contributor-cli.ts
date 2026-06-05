import { CliRoot } from '../../kernel/application/abstracts/cli-root.ts';
import type { CliCommand } from '../../kernel/application/abstracts/cli-command.ts';
import type { MaintainerCliHost } from '../../maintainer/composition/create-maintainer-cli.ts';
import { composeLocalContributorCommandTree } from './local-contributor-command-tree.ts';

/** Local contributor command tree returned by `createLocalContributorCli`. */
export interface LocalContributorCliCommand {
  /** Parse command-line arguments. */
  readonly parse: (args?: string[]) => Promise<unknown> | unknown;
}

/** Declarative local contributor CLI root. */
export class LocalContributorCli extends CliRoot<LocalContributorCliCommand> {
  readonly id = 'local.contributor.cli';

  constructor(private readonly host: MaintainerCliHost) {
    super();
  }

  commands(): readonly CliCommand<LocalContributorCliCommand>[] {
    return [];
  }

  define(_commands: readonly CliCommand<LocalContributorCliCommand>[]): LocalContributorCliCommand {
    return composeLocalContributorCommandTree(this.host);
  }
}

/** Create the local contributor CLI used inside the monorepo checkout. */
export function createLocalContributorCli(host: MaintainerCliHost): LocalContributorCliCommand {
  const root = new LocalContributorCli(host);
  return root.define(root.commands());
}
