/** Options accepted by `netscript ui:init`. */
export interface UiInitCommandInput {
  readonly projectRoot?: string;
  readonly registryRoot?: string;
  readonly force?: boolean;
}
