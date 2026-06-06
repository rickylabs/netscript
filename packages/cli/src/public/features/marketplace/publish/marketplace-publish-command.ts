/**
 * @module
 *
 * Public `netscript marketplace publish` stub.
 *
 * F-9 permissions: this stub prints static guidance and does not require
 * filesystem, network, environment, or subprocess permissions.
 */

import { Command } from '@cliffy/command';

import { outputText } from '../../../../kernel/presentation/output/default-output.ts';

/** Dependencies for the marketplace publish stub. */
export interface MarketplacePublishCommandDependencies {
  /** Print output lines. */
  readonly print?: (message: string) => void;
}

/** Create the public marketplace publish stub command. */
export function createMarketplacePublishCommand(
  dependencies: MarketplacePublishCommandDependencies = {},
): Command<any, any, any, any, any, any, any, any> {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('publish')
    .description('Publish a NetScript plugin to the marketplace')
    .action((): void => {
      print('Plugin marketplace publishing coming soon.');
      print('Publish plugin packages to JSR with the netscript-plugin keyword for now.');
    }) as unknown as Command;
}
