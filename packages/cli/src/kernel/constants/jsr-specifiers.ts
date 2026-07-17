/**
 * JSR package specifiers used by public CLI scaffolding.
 */

import { CLI_PACKAGE_VERSION } from '../assets/publish-assets.generated.ts';

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
export const NETSCRIPT_RELEASE_VERSION: string = CLI_PACKAGE_VERSION;

/** Exact JSR version suffix for NetScript prerelease package pins. */
export const NETSCRIPT_RELEASE_TAG = `@${NETSCRIPT_RELEASE_VERSION}`;

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
