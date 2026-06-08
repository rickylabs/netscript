import { PluginContribution } from './plugin-contribution.ts';

/** Base class for contract version contribution implementations. */
export abstract class PluginContractVersionContribution extends PluginContribution {
  /** Contribution axis for contract version loaders. */
  readonly axis = 'contract-version' as const;
  /** Contract version identifier provided by the plugin. */
  abstract readonly version: string;
  /** Module path for loading the contract version. */
  abstract readonly loader: string;
}
