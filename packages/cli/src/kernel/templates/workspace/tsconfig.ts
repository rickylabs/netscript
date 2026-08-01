/**
 * @module templates/workspace/tsconfig
 *
 * Root TypeScript project-boundary generator.
 */

/** Generates a root tsconfig that terminates upward lookup without claiming Deno source files. */
export function generateTsConfig(): string {
  return JSON.stringify({ files: [] }, null, 2) + '\n';
}
