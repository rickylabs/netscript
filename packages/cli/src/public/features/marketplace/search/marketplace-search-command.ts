import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
/**
 * @module
 *
 * Public `netscript marketplace search <query>` stub.
 *
 * F-9 permissions: this stub prints a static JSR search URL and does not
 * require filesystem, network, environment, or subprocess permissions.
 */

import { Command } from '@cliffy/command';

import { outputText } from '../../../../kernel/presentation/output/default-output.ts';

/** Dependencies for the marketplace search stub. */
export interface MarketplaceSearchCommandDependencies {
  /** Print output lines. */
  readonly print?: (message: string) => void;
}

/** Create the public marketplace search stub command. */
export function createMarketplaceSearchCommand(
  dependencies: MarketplaceSearchCommandDependencies = {},
): CliffyCommand {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('search')
    .description('Search the NetScript plugin marketplace')
    .arguments('<query:string>')
    .action((_options: unknown, query: string): void => {
      const encoded = encodeURIComponent(`netscript-plugin-${query}`);
      print('Plugin marketplace coming soon.');
      print(`Find plugins at https://jsr.io/?search=${encoded}`);
    });
}
