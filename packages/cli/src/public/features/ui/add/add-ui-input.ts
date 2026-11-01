/** Options accepted by `netscript ui:add`. */
export interface UiAddCommandInput {
  readonly projectRoot?: string;
  readonly app?: string;
  readonly registryRoot?: string;
  readonly theme?: string;
  readonly force?: boolean;
  readonly diff?: boolean;
  readonly json?: boolean;
  readonly dryRun?: boolean;
  readonly route?: string;
  readonly island?: boolean;
  readonly query?: boolean;
  readonly client?: string;
  /** `--nav [label]` (true or the label) or `--no-nav` (false); page scaffolds only. */
  readonly nav?: boolean | string;
}
