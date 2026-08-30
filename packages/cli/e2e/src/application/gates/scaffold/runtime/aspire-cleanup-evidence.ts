/** RED-first post-stop ownership classification contract. */
export interface PostStopProbeEvaluation {
  readonly ownedContainers: readonly { readonly id: string }[];
  readonly foreignContainers: readonly { readonly id: string }[];
  readonly unprovenContainers: readonly { readonly id: string }[];
  readonly ownedProcesses: readonly { readonly pid: number }[];
  readonly foreignProcesses: readonly { readonly pid: number }[];
}

/** Placeholder contract for the RED-first S10 cleanup slice. */
export function evaluatePostStopProbe(
  _fixture: unknown,
  _appHost: string,
): PostStopProbeEvaluation {
  throw new Error('S10 post-stop probe is not implemented');
}
