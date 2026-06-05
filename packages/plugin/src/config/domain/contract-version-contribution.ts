/** Contract version contributed by a plugin. */
export interface ContractVersionContribution {
  /** Version identifier contributed by the plugin. */
  readonly version: string;
  /** Module path that loads this contract version. */
  readonly loader: string;
}
