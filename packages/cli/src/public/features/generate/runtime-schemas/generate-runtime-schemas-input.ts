/** Parsed options accepted by `generate runtime-schemas`. */
export interface GenerateRuntimeSchemasCommandInput {
  readonly verbose?: boolean;
  readonly dryRun?: boolean;
  readonly force?: boolean;
  readonly projectRoot?: string;
}
