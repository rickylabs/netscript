/** Service contributed by a plugin. */
export interface ServiceContribution {
  /** Logical service name. */
  readonly name: string;
  /** Service entrypoint path. */
  readonly entrypoint: string;
  /** Optional service port. */
  readonly port?: number;
}
