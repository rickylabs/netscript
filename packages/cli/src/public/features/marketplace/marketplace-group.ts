import { Command } from '@cliffy/command';

import { createMarketplacePublishCommand } from './publish/marketplace-publish-command.ts';
import { createMarketplaceSearchCommand } from './search/marketplace-search-command.ts';

/** Create the public marketplace command group. */
export function createMarketplaceCommand(): Command<any, any, any, any, any, any, any, any> {
  return new Command()
    .name('marketplace')
    .description('Discover and publish NetScript plugins')
    .action(function () {
      this.showHelp();
    })
    .command('search', createMarketplaceSearchCommand())
    .command('publish', createMarketplacePublishCommand());
}
