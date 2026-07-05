/** Relationship between two Aspire resources. */
export interface ReferenceSpec {
  /** Name of the resource that declares the dependency. */
  readonly from: string;
  /** Name of the resource being referenced. */
  readonly to: string;
  /** Whether the source should wait for the referenced resource. */
  readonly waitFor?: boolean;
}
