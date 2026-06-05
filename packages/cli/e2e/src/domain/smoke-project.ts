/** Resolved paths and source mode for one generated smoke project. */
export interface SmokeProject {
  readonly repoRoot: string;
  readonly cliEntrypoint: string;
  readonly smokeRoot: string;
  readonly projectName: string;
  readonly projectRoot: string;
  readonly appHost: string;
}
