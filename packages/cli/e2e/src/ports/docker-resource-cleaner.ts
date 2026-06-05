/** Snapshot of Docker resources that existed before a suite started. */
export interface DockerResourceSnapshot {
  readonly containerIds: readonly string[];
}

/** Port for suite-scoped Docker cleanup. */
export interface DockerResourceCleaner {
  captureSnapshot(): Promise<DockerResourceSnapshot>;
  pruneCreatedResources(snapshot: DockerResourceSnapshot): Promise<readonly string[]>;
}
