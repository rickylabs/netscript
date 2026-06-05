/** Relationship between two Aspire resources. */
export interface ReferenceSpec {
  readonly from: string;
  readonly to: string;
  readonly waitFor?: boolean;
}
