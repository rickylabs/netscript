/** Options accepted by `netscript ui:add`. */
export interface UiAddCommandInput {
  readonly projectRoot?: string;
  readonly registryRoot?: string;
  readonly theme?: string;
  readonly force?: boolean;
}
