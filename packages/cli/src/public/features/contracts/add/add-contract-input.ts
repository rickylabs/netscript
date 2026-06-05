/** Parsed options accepted by `netscript contract add`. */
export interface AddContractInput {
  readonly version?: string;
  readonly path?: string;
  readonly force?: boolean;
}
