/** Result of optional Aspire agent initialization. */
export type AspireAgentInitializationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string };

/** External Aspire agent initializer consumed by `netscript agent init`. */
export interface AspireAgentInitializer {
  initialize(
    projectRoot: string,
    signal: AbortSignal,
  ): Promise<AspireAgentInitializationResult>;
}
