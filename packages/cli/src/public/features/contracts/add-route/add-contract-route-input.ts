/** Parsed options for `contract add-route`. */
export interface AddContractRouteInput {
  readonly method: string;
  readonly path: string;
  readonly input?: string;
  readonly output?: string;
  readonly version?: string;
  readonly projectRoot?: string;
}
