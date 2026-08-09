/** Options accepted by `netscript ui:add`. */
export interface UiAddCommandInput {
  readonly projectRoot?: string;
  readonly app?: string;
  readonly registryRoot?: string;
  readonly theme?: string;
  readonly force?: boolean;
  readonly route?: string;
  readonly island?: boolean;
  readonly query?: boolean;
}
