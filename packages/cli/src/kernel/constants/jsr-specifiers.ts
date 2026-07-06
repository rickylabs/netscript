/**
 * JSR package specifiers used by public CLI scaffolding.
 */

import cliPackageJson from '../../../deno.json' with { type: 'json' };

/** NetScript package names that public scaffolds may import from JSR. */
export type NetscriptPackage =
  | 'aspire'
  | 'config'
  | 'contracts'
  | 'database'
  | 'fresh'
  | 'fresh-ui'
  | 'kv'
  | 'logger'
  | 'plugin'
  | 'plugin-workers'
  | 'plugin-auth-core'
  | 'auth-workos'
  | 'auth-better-auth'
  | 'auth-kv-oauth'
  | 'plugin-sagas'
  | 'plugin-sagas-core'
  | 'plugin-triggers'
  | 'plugin-triggers-core'
  | 'prisma-adapter-mysql'
  | 'runtime-config'
  | 'sdk'
  | 'service'
  | 'telemetry'
  | 'workers';

/** Release train version sourced from the CLI package manifest. */
export const NETSCRIPT_RELEASE_VERSION: string = cliPackageJson.version;

/** Exact JSR version suffix for NetScript prerelease package pins. */
export const NETSCRIPT_RELEASE_TAG = `@${NETSCRIPT_RELEASE_VERSION}`;

/**
 * Published JSR version of the `@netscript/ai` engine package.
 *
 * `@netscript/ai` is deliberately version-decoupled from the release train
 * (the defer-AI-publish decision): the train sits at
 * {@link NETSCRIPT_RELEASE_VERSION} while `@netscript/ai` is published
 * independently and referenced at its own version — exactly the version
 * `packages/plugin-ai-core/deno.json` pins in its manifest. Pinning it with
 * {@link netscriptJsrSpecifier} would reference an unpublished version and
 * hard-fail prod installs. Drift is guarded by the workspace-mutator test
 * that cross-checks this constant against the `@netscript/ai` pin declared
 * by `packages/plugin-ai-core/deno.json`.
 */
export const NETSCRIPT_AI_ENGINE_VERSION = '0.0.1-alpha.0';

/** Build an exact JSR specifier for a NetScript package and optional export subpath. */
export function netscriptJsrSpecifier(
  packageName: string,
  subpath: string = '',
): string {
  return `jsr:@netscript/${packageName}${NETSCRIPT_RELEASE_TAG}${subpath}`;
}

/** Published JSR specifiers for NetScript packages. */
export const JSR_SPECIFIERS: Readonly<Record<NetscriptPackage, string>> = {
  aspire: netscriptJsrSpecifier('aspire'),
  config: netscriptJsrSpecifier('config'),
  contracts: netscriptJsrSpecifier('contracts'),
  database: netscriptJsrSpecifier('database'),
  fresh: netscriptJsrSpecifier('fresh'),
  'fresh-ui': netscriptJsrSpecifier('fresh-ui'),
  kv: netscriptJsrSpecifier('kv'),
  logger: netscriptJsrSpecifier('logger'),
  plugin: netscriptJsrSpecifier('plugin'),
  'plugin-workers': netscriptJsrSpecifier('plugin-workers'),
  'plugin-auth-core': netscriptJsrSpecifier('plugin-auth-core'),
  'auth-workos': netscriptJsrSpecifier('auth-workos'),
  'auth-better-auth': netscriptJsrSpecifier('auth-better-auth'),
  'auth-kv-oauth': netscriptJsrSpecifier('auth-kv-oauth'),
  'plugin-sagas': netscriptJsrSpecifier('plugin-sagas'),
  'plugin-sagas-core': netscriptJsrSpecifier('plugin-sagas-core'),
  'plugin-triggers': netscriptJsrSpecifier('plugin-triggers'),
  'plugin-triggers-core': netscriptJsrSpecifier('plugin-triggers-core'),
  'prisma-adapter-mysql': netscriptJsrSpecifier('prisma-adapter-mysql'),
  'runtime-config': netscriptJsrSpecifier('runtime-config'),
  sdk: netscriptJsrSpecifier('sdk'),
  service: netscriptJsrSpecifier('service'),
  telemetry: netscriptJsrSpecifier('telemetry'),
  workers: netscriptJsrSpecifier('plugin-workers-core'),
} as const;
