/** Declarative reference to a published SDK client-contribution factory. */
export interface SdkClientContributionReference {
  /** Stable protocol discriminator supported by the SDK contribution seam. */
  readonly protocol: {
    /** NetScript SDK contribution protocol family. */
    readonly family: 'netscript.sdk-client';
    /** Supported protocol major. */
    readonly major: 1;
  };
  /** Globally named contribution identifier exposed by the referenced factory. */
  readonly id: `${string}:${string}`;
  /** Published module specifier containing the contribution factory. */
  readonly module: string;
  /** Named factory export within the published module. */
  readonly export: string;
  /** Runtime targets on which the factory is safe to load. */
  readonly targets: readonly ('browser' | 'server')[];
}
