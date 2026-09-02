/** Upstream workflow skills installed beside NetScript's canonical `aspire` skill. */
export const ASPIRE_WORKFLOW_SKILLS: readonly string[] = [
  'aspire-init',
  'aspire-orchestration',
  'aspire-monitoring',
  'aspire-deployment',
];

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
