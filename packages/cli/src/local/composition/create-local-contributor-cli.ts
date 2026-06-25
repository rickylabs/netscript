import { CliRoot } from '../../kernel/application/abstracts/cli-root.ts';
import type { CliCommand } from '../../kernel/application/abstracts/cli-command.ts';
import type { MaintainerCliHost } from '../../maintainer/composition/create-maintainer-cli.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../kernel/application/registries/template-registry.ts';
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
  const command = root.define(root.commands());
  // Mirror `runPublicCli`: hydrate the template registry once at the composition
  // root so every dispatched command runs after async hydration, before any sync
  // template read. `hydrate()` is memoized, so repeat calls are free.
  return {
    parse: async (args?: string[]) => {
      await DEFAULT_TEMPLATE_REGISTRY.hydrate();
      return await command.parse(args);
    },
  };
}
