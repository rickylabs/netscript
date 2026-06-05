import { CliRoot } from '../../kernel/application/abstracts/cli-root.ts';
import type { CliCommand } from '../../kernel/application/abstracts/cli-command.ts';
import {
  createPublicCommandTree,
  type PublicCliCommand,
  type PublicCliHost,
} from '../features/root/public-command-tree.ts';

export type { PublicCliCommand, PublicCliHost };

/** Declarative public CLI root. */
export class PublicCli extends CliRoot<PublicCliCommand> {
  readonly id = 'public.cli';

  constructor(private readonly host: PublicCliHost) {
    super();
  }

  commands(): readonly CliCommand<PublicCliCommand>[] {
    return [];
  }

  define(_commands: readonly CliCommand<PublicCliCommand>[]): PublicCliCommand {
    return createPublicCommandTree(this.host);
  }
}

/** Create the public NetScript CLI command tree. */
export function createPublicCli(host: PublicCliHost): PublicCliCommand {
  const root = new PublicCli(host);
  return root.define(root.commands());
}
