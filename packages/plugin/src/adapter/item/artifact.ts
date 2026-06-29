/**
 * Text body owned by a scaffold artifact.
 *
 * @example
 * ```ts
 * const body: ScaffoldArtifactBody = { kind: 'text', text: 'export {};' };
 * console.log(body.kind);
 * ```
 */
export interface ScaffoldArtifactBody {
  /** Body kind written by the scaffold installer. */
  readonly kind: 'text';
  /** UTF-8 source text written to the target path. */
  readonly text: string;
}

/**
 * Userland file emitted by the unified plugin item generator.
 *
 * @example
 * ```ts
 * const artifact: ScaffoldArtifact = {
 *   path: 'src/jobs/send-email.ts',
 *   body: { kind: 'text', text: 'export {};' },
 * };
 *
 * console.log(artifact.path);
 * ```
 */
export interface ScaffoldArtifact {
  /** Workspace-relative path where the artifact is written. */
  readonly path: string;
  /** Typed source body written to the artifact path. */
  readonly body: ScaffoldArtifactBody;
  /** Whether this artifact contributes a database migration or schema. */
  readonly databaseMigration?: boolean;
}

/**
 * Create a text scaffold artifact.
 *
 * @param path Workspace-relative path for the artifact.
 * @param text UTF-8 source text written to the artifact.
 * @returns A typed scaffold artifact descriptor.
 *
 * @example
 * ```ts
 * const artifact = textArtifact('src/plugin.ts', 'export {};');
 * console.log(artifact.body.text);
 * ```
 */
export function textArtifact(path: string, text: string): ScaffoldArtifact {
  return { path, body: { kind: 'text', text } };
}

/**
 * Read the text body from a scaffold artifact.
 *
 * @param artifact Artifact whose body is expected to be text.
 * @returns UTF-8 text body.
 *
 * @example
 * ```ts
 * const text = artifactText(textArtifact('mod.ts', 'export {};'));
 * console.log(text);
 * ```
 */
export function artifactText(artifact: ScaffoldArtifact): string {
  return artifact.body.text;
}
