/**
 * A single userland file emitted by a plugin-owned scaffolder.
 *
 * An artifact is a typed file descriptor: a workspace-relative `path` paired with its full text
 * `content`. The content is sourced from text-imported real `.ts` stubs or from a typed builder
 * (such as {@linkcode buildScaffoldPluginJson}); it is never assembled by ad-hoc string
 * concatenation in the scaffolder. The composition factory created by `createPluginScaffold` writes
 * each artifact through an injected `FileSystemPort`.
 */
export interface ScaffoldArtifact {
  /** Workspace-relative path the artifact is written to, using forward slashes. */
  readonly path: string;
  /** Full text content written to {@linkcode ScaffoldArtifact.path}. */
  readonly content: string;
}
