/** A workspace-relative file artifact produced by a plugin scaffolder. */
export interface ScaffoldArtifact {
  /** Workspace-relative path where the artifact should be written. */
  readonly path: string;
  /** Text content to write for the artifact. */
  readonly content: string;
}
