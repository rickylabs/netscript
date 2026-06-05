import { CliRoot } from '../../kernel/application/abstracts/cli-root.ts';
import type { CliCommand } from '../../kernel/application/abstracts/cli-command.ts';
import {
  createMaintainerCommandTree,
  type MaintainerCliCommand,
  type MaintainerCliHost,
} from '../features/root/maintainer-command-tree.ts';

export type { MaintainerCliCommand, MaintainerCliHost };

/** Declarative maintainer CLI root. */
export class MaintainerCli extends CliRoot<MaintainerCliCommand> {
  readonly id = 'maintainer.cli';

  constructor(private readonly host: MaintainerCliHost) {
    super();
  }

  commands(): readonly CliCommand<MaintainerCliCommand>[] {
    return [];
  }

  define(_commands: readonly CliCommand<MaintainerCliCommand>[]): MaintainerCliCommand {
    return createMaintainerCommandTree(this.host);
  }
}

/** Create the maintainer NetScript CLI command tree. */
export function createMaintainerCli(host: MaintainerCliHost): MaintainerCliCommand {
  const root = new MaintainerCli(host);
  return root.define(root.commands());
}
