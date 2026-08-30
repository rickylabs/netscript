/** RED-first last-seen resource observation contract. */
export interface DescribeResourceObservation {
  readonly name: string;
  readonly state: string;
  readonly healthReports: Readonly<Record<string, { readonly status: string }>>;
}

/** Placeholder contract for the RED-first S10 describe-follow slice. */
export function evaluateDescribeFollow(
  _text: string,
  _resources: readonly string[],
): { readonly resources: readonly DescribeResourceObservation[] } {
  throw new Error('S10 describe-follow evidence is not implemented');
}
