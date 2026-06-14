/** Options accepted by `netscript ui:init`. */
export interface UiInitCommandInput {
  readonly projectRoot?: string;
  readonly registryRoot?: string;
  readonly theme?: string;
  readonly force?: boolean;
}
