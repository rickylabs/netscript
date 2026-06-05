import { PluginContribution } from './plugin-contribution.ts';

/** Base class for contract version contribution implementations. */
export abstract class PluginContractVersionContribution extends PluginContribution {
  readonly axis = 'contract-version' as const;
  abstract readonly version: string;
  abstract readonly loader: string;
}
