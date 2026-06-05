/**
 * Public API for the NetScript CLI package.
 *
 * @module
 *
 * @example Create an embeddable NetScript CLI command tree.
 * ```ts
 * import { createPublicCli } from "@netscript/cli";
 *
 * const cli = createPublicCli({
 *   cwd: () => "/workspace/app",
 *   resolvePath: (path = ".") => `/workspace/app/${path}`,
 * });
 * ```
 */
export * from './src/public/public-api.ts';
