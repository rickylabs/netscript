/** Isolated installation tree whose files can be applied after validation. */
export interface ProjectStage {
  /** Temporary project root; never aliases files in the live project. */
  readonly root: string;
  /** Apply changed files and removals to the live project. */
  commit(): Promise<void>;
  /** Remove the temporary tree, including after a failed installation or validation. */
  dispose(): Promise<void>;
}

/** Port for staging project mutations without changing the live tree. */
export interface ProjectStagePort {
  stage(projectRoot: string): Promise<ProjectStage>;
}
