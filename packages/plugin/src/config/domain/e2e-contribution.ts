/** End-to-end test contribution. */
export interface E2eContribution {
  /** Test contribution name. */
  readonly name: string;
  /** Command used to execute the test contribution. */
  readonly command: string;
}
